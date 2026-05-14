import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Settings, 
  Gift, 
  LogOut, 
  ChevronRight, 
  CircleDot, 
  ShieldCheck,
  Package,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  User,
  Calculator,
  Save,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onSnapshot, 
  doc, 
  setDoc, 
  collection, 
  DocumentData,
  getDocFromServer
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from './lib/firebase';

// Error Handling according to instructions
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Utilities
const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' đ';
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(num));
};

const formatPercent = (num: number) => {
  return (num * 100).toFixed(1) + '%';
};

const ADMIN_EMAIL = 'vinh.ngtienmdb@gmail.com';

interface ConfigData {
  a_max_tgd: number;
  a_max_gd: number;
  a_max_ql: number;
  a_max_nv: number;
  a_max_direct: number;
  a_max_indirect: number;
  p_b_rate1: number;
  p_b_rate2: number;
  p_b_rate3: number;
  p_b_rate4: number;
  p_b_rate5: number;
  p_b_rate6: number;
  p_b_rate7: number;
}

const DEFAULT_CONFIG: ConfigData = {
  a_max_tgd: 20,
  a_max_gd: 15,
  a_max_ql: 10,
  a_max_nv: 5,
  a_max_direct: 10,
  a_max_indirect: 5,
  p_b_rate1: 0,
  p_b_rate2: 10,
  p_b_rate3: 5,
  p_b_rate4: 0,
  p_b_rate5: 0,
  p_b_rate6: 15,
  p_b_rate7: 0
};

export default function App() {
  // --- States ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [loginError, setLoginError] = useState('');

  // Fixed Parameters (Admin Only)
  const [config, setConfig] = useState<ConfigData>(DEFAULT_CONFIG);
  
  // User Inputs
  const [price, setPrice] = useState(4000000);
  const [turns, setTurns] = useState(20);
  const [productChoice, setProductChoice] = useState<'take' | 'resell'>('resell');
  const [dailyLuckyRate, setDailyLuckyRate] = useState(0.12);
  const [luckyMul, setLuckyMul] = useState(5.5);

  // User Rank States
  const [userRank, setUserRank] = useState('gd');
  const [subGd, setSubGd] = useState(false);
  const [subQl, setSubQl] = useState(false);
  const [subNv, setSubNv] = useState(false);

  // --- Effects ---
  useEffect(() => {
    // Validate connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email === ADMIN_EMAIL) {
        setAdminMode(true);
      } else {
        setAdminMode(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'configs', 'main'), (snap) => {
      if (snap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as ConfigData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'configs/main');
    });
    return () => unsub();
  }, []);

  // --- Calculations ---
  const calculations = useMemo(() => {
    const unitPrice = price / 5;
    const groupPrice = turns * unitPrice;
    const deduction = groupPrice / 2;
    const totalInvest = groupPrice + deduction;
    const luckyBalance = deduction * luckyMul;
    const resellRate = productChoice === 'take' ? 0 : 0.8;

    let r1 = config.p_b_rate1;
    let r2 = config.p_b_rate2;
    let r3 = config.p_b_rate3;
    let r4 = config.p_b_rate4;
    let r5 = config.p_b_rate5;
    let r6 = config.p_b_rate6;
    let r7 = config.p_b_rate7;

    // Rank Commission Logic (User Mode)
    if (!adminMode && userRank !== 'kh') {
      r2 = config.a_max_direct;
      r3 = config.a_max_indirect;
      
      const ranks = [
        { id: 4, label: 'nv', max: config.a_max_nv, active: userRank === 'nv' || subNv },
        { id: 5, label: 'ql', max: config.a_max_ql, active: userRank === 'ql' || subQl },
        { id: 6, label: 'gd', max: config.a_max_gd, active: userRank === 'gd' || subGd },
        { id: 7, label: 'tgd', max: config.a_max_tgd, active: userRank === 'tgd' }
      ];

      // Reset rank commissions
      r4 = 0; r5 = 0; r6 = 0; r7 = 0;

      let currentDeduction = 0;
      const targetRankIndex = ranks.findIndex(r => r.label === userRank);
      
      if (targetRankIndex !== -1) {
        const relevantRanks = ranks.slice(0, targetRankIndex + 1);
        for (let i = 0; i < relevantRanks.length; i++) {
          const r = relevantRanks[i];
          if (r.active) {
            const commission = Math.max(0, r.max - currentDeduction);
            if (r.id === 4) r4 = commission;
            if (r.id === 5) r5 = commission;
            if (r.id === 6) r6 = commission;
            if (r.id === 7) r7 = commission;
            currentDeduction = r.max;
          }
        }
      }
    } else if (userRank === 'kh') {
      r1 = 0; r2 = 0; r3 = 0; r4 = 0; r5 = 0; r6 = 0; r7 = 0;
    }

    const rates = [r1, r2, r3, r4, r5, r6, r7];
    const amnts = rates.map(r => deduction * (r / 100));
    const totalHH = amnts.reduce((acc, curr) => acc + curr, 0);
    const resellAmt = price * resellRate;
    const capitalReturned = groupPrice - unitPrice;
    const instantTotal = totalHH + resellAmt;
    const needToCover = totalInvest - totalHH - resellAmt - capitalReturned;

    const initialBal = luckyBalance;
    const dailyLixi1 = initialBal * (dailyLuckyRate / 100);
    
    // Timeline
    const timeline = [];
    let currBalance = initialBal;
    let accumCash = 0;
    const totalRatePercent = rates.reduce((a, b) => a + b, 0) / 100;

    for (let day = 1; day <= 365; day++) {
       const genLixi = currBalance * (dailyLuckyRate / 100);
       // Simplification: no new tickets in this basic dash projection unless specified
       const cashToday = genLixi; 
       accumCash += cashToday;
       const endBalance = currBalance - genLixi;
       
       timeline.push({
         day,
         start: currBalance,
         gen: genLixi,
         accum: accumCash,
         end: endBalance,
         isBreakeven: accumCash >= needToCover
       });
       currBalance = endBalance;
    }

    const roi = needToCover > 0 ? (accumCash - needToCover) / needToCover : 0;
    const daysToCover = dailyLixi1 > 0 ? Math.ceil(needToCover / dailyLixi1) : Infinity;

    return {
      unitPrice,
      groupPrice,
      deduction,
      totalInvest,
      luckyBalance,
      rates,
      amnts,
      totalHH,
      resellAmt,
      capitalReturned,
      instantTotal,
      needToCover,
      initialBal,
      dailyLixi1,
      accumCash,
      roi,
      daysToCover,
      timeline,
      resellRate
    };
  }, [price, turns, productChoice, dailyLuckyRate, luckyMul, userRank, subGd, subQl, subNv, config, adminMode]);

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, loginEmail, loginPwd);
      if (result.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setLoginError("Lỗi: Tài khoản không có quyền Admin.");
      } else {
        setShowLoginModal(false);
        setLoginError('');
      }
    } catch (err: any) {
      setLoginError("Đăng nhập thất bại: " + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setLoginError("Lỗi: Tài khoản không có quyền Admin.");
      } else {
        setShowLoginModal(false);
        setLoginError('');
      }
    } catch (err: any) {
      setLoginError("Đăng nhập thất bại: " + err.message);
    }
  };

  const saveConfig = async () => {
    if (!user || user.email !== ADMIN_EMAIL) {
      alert("Bạn cần đăng nhập Admin để lưu cấu hình!");
      return;
    }
    const path = 'configs/main';
    try {
      await setDoc(doc(db, 'configs', 'main'), config, { merge: true });
      alert("Lưu cấu hình thành công!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <TrendingUp className="text-white size-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Lucky Shop Analytics</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600">
              <CircleDot className="size-3 text-green-500 animate-pulse" />
              Live Projection
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-gray-900">{user.displayName || 'Admin'}</p>
                  <p className="text-[10px] text-gray-500">{user.email}</p>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="bg-red-50 text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
              >
                <LogIn className="size-4" />
                Admin Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* Top Section: Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Card A: Parameters */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calculator className="size-5 text-blue-600" />
                Thông Số Đầu Vào
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">Giá sản phẩm</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formatNumber(price)} 
                    onChange={(e) => setPrice(parseInt(e.target.value.replace(/\./g, '')) || 0)}
                    className="w-32 bg-gray-50 border-none text-right font-bold text-blue-600 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="text-[10px] absolute -right-8 top-1.5 text-gray-400">VNĐ</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Giá gom nhóm</span>
                <span className="font-semibold">{formatNumber(calculations.groupPrice)} đ</span>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">Số lượt gom</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={turns} 
                    onChange={(e) => setTurns(parseInt(e.target.value) || 0)}
                    className="w-32 bg-gray-50 border-none text-right font-bold text-blue-600 rounded-lg px-2 py-1 outline-none"
                  />
                   <span className="text-[10px] absolute -right-8 top-1.5 text-gray-400">lượt</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Số tiền gom/SP</span>
                <span className="font-semibold">{formatNumber(calculations.unitPrice)} đ</span>
              </div>
              <div className="flex items-center justify-between text-sm bg-blue-50/50 p-2 rounded-lg">
                <span className="text-blue-700">Phiếu khấu trừ</span>
                <span className="font-bold text-blue-700">{formatNumber(calculations.deduction)} đ</span>
              </div>
              <div className="flex items-center justify-between text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                <span className="text-red-700 font-bold uppercase tracking-wider text-[10px]">Tổng Vốn</span>
                <span className="font-bold text-red-700 text-base">{formatNumber(calculations.totalInvest)} đ</span>
              </div>
              
              <div className="pt-4 border-t border-gray-50">
                <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Tùy Chọn Sản Phẩm</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setProductChoice('take')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${productChoice === 'take' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}
                  >
                    Lấy Sản Phẩm
                  </button>
                   <button 
                    onClick={() => setProductChoice('resell')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${productChoice === 'resell' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}
                  >
                    Bán Lại
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mt-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                    <Gift className="size-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">SỐ DƯ LÌ XÌ BAN ĐẦU</span>
                   </div>
                   <span className="text-sm font-black text-amber-700">{formatNumber(calculations.initialBal)} đ</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card B: Commissions */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ArrowUpRight className="size-5 text-green-600" />
                Hoa Hồng & Hoàn Ngay
              </h2>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-2">
                <span>HẠNG MỤC</span>
                <span className="text-center">TỶ LỆ</span>
                <span className="text-right">TIỀN MẶT</span>
              </div>
              
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {[
                  { label: 'HH Trực tiếp', rate: calculations.rates[1], amt: calculations.amnts[1] },
                  { label: 'HH Gián tiếp', rate: calculations.rates[2], amt: calculations.amnts[2] },
                  { label: 'HH Nhân viên', rate: calculations.rates[3], amt: calculations.amnts[3], sub: true },
                  { label: 'HH Quản lý', rate: calculations.rates[4], amt: calculations.amnts[4], sub: true },
                  { label: 'HH Giám đốc', rate: calculations.rates[5], amt: calculations.amnts[5], sub: true },
                  { label: 'HH Tổng GĐ', rate: calculations.rates[6], amt: calculations.amnts[6], sub: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors group">
                    <span className={`text-xs font-medium ${item.sub ? 'text-gray-500 pl-2' : 'text-gray-700'}`}>{item.label}</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center justify-center min-w-[50px]">{item.rate}%</span>
                    <span className="text-xs font-bold text-gray-900 tabular-nums">{formatNumber(item.amt)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-2 border-t border-gray-100">
                <div className="flex items-center justify-between bg-amber-50/50 p-2 rounded-lg">
                  <span className="text-xs font-bold text-amber-800">Tổng HH phát sinh</span>
                  <span className="font-bold text-amber-800">{formatNumber(calculations.totalHH)} đ</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                   <span className="text-xs font-medium text-gray-600">Bán lại SP ({formatPercent(calculations.resellRate)})</span>
                   <span className="font-bold text-gray-800">{formatNumber(calculations.resellAmt)} đ</span>
                </div>
                 <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                   <span className="text-xs font-medium text-gray-600">Gốc hoàn về (Bao nhóm)</span>
                   <span className="font-bold text-gray-800">{formatNumber(calculations.capitalReturned)} đ</span>
                </div>
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100">
                  <span className="text-[10px] font-black text-green-700 uppercase">Hoàn Ngay Lập Tức</span>
                  <span className="font-black text-green-700 text-base">{formatNumber(calculations.instantTotal)} đ</span>
                </div>
                <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-100">
                  <span className="text-[10px] font-black text-red-700 uppercase">Phần Còn Phải Bù</span>
                  <span className="font-black text-red-700 text-base">{formatNumber(calculations.needToCover)} đ</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card C: Roles / System Config */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
             <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {adminMode ? <ShieldCheck className="size-5 text-purple-600" /> : <User className="size-5 text-gray-600" />}
                {adminMode ? 'Cấu Hình Hệ Thống' : 'Vai Trò & Tuyến Dưới'}
              </h2>
              {user?.email === ADMIN_EMAIL && (
                <button 
                  onClick={() => setAdminMode(!adminMode)}
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded transition-all ${adminMode ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  {adminMode ? 'Đóng Admin' : 'Mở Admin'}
                </button>
              )}
            </div>

            {adminMode ? (
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">LÌ XÌ % / NGÀY</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={dailyLuckyRate}
                      onChange={(e) => setDailyLuckyRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 font-bold text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">HỆ SỐ LÌ XÌ</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={luckyMul}
                      onChange={(e) => setLuckyMul(parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 font-bold text-sm outline-none"
                    />
                  </div>
                </div>
                
                <h3 className="text-xs font-bold text-gray-400 uppercase mt-4 mb-2">Max HH Cấp Bậc (%)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(config).filter(k => k.startsWith('a_max_')).map(key => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">{key.replace('a_max_', '').replace('tgd', 'Tổng GD')}</label>
                      <input 
                        type="number" 
                        value={config[key as keyof ConfigData]}
                        onChange={(e) => setConfig({ ...config, [key]: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-lg p-1.5 font-bold text-xs"
                      />
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={saveConfig}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="size-4" />
                  Lưu Cấu Hình Mới
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Cấp bậc của BẠN</label>
                  <select 
                    value={userRank}
                    onChange={(e) => setUserRank(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="tgd">Tổng Giám đốc</option>
                    <option value="gd">Giám đốc</option>
                    <option value="ql">Quản lý</option>
                    <option value="nv">Nhân viên</option>
                    <option value="kh">Khách hàng (0%)</option>
                  </select>
                </div>

                {userRank !== 'kh' && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                    <p className="text-xs font-black text-amber-600 uppercase flex items-center gap-2">
                      <RefreshCw className="size-3" />
                      Tuyến Dưới Chênh Lệch
                    </p>
                    <div className="space-y-3">
                      {['tgd', 'gd', 'ql'].includes(userRank) && (
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="chk_nv" 
                            checked={subNv} 
                            onChange={(e) => setSubNv(e.target.checked)} 
                            className="size-4 rounded accent-blue-600"
                          />
                          <label htmlFor="chk_nv" className="text-sm font-medium text-gray-700 cursor-pointer">Có Nhân viên tham gia</label>
                        </div>
                      )}
                      {['tgd', 'gd'].includes(userRank) && (
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="chk_ql" 
                            checked={subQl} 
                            onChange={(e) => setSubQl(e.target.checked)}
                            className="size-4 rounded accent-blue-600"
                          />
                          <label htmlFor="chk_ql" className="text-sm font-medium text-gray-700 cursor-pointer">Có Quản lý tham gia</label>
                        </div>
                      )}
                      {userRank === 'tgd' && (
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="chk_gd" 
                            checked={subGd} 
                            onChange={(e) => setSubGd(e.target.checked)}
                             className="size-4 rounded accent-blue-600"
                          />
                          <label htmlFor="chk_gd" className="text-sm font-medium text-gray-700 cursor-pointer">Có Giám đốc tham gia</label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Dashboard Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Phân Tích Hòa Vốn</h2>
              <p className="text-sm text-gray-500">Tổng quan tài chính & Dự phóng dòng tiền</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TỔNG VỐN', val: calculations.totalInvest, sub: 'Giá gốc + Khấu trừ', color: 'red' },
              { label: 'BÁN LẠI SP', val: calculations.resellAmt, sub: 'Thu hồi từ sản phẩm', color: 'green' },
              { label: 'TỔNG HOÀN LẬP TỨC', val: calculations.instantTotal, sub: 'HH + Gốc hoàn', color: 'amber' },
              { label: 'CẦN BÙ LÌ XÌ', val: calculations.needToCover, sub: 'Mục tiêu hoàn vốn', color: 'blue' },
            ].map((card, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`bg-white p-5 rounded-2xl border-t-4 border-${card.color}-500 shadow-sm border-x border-b border-gray-100 hover:shadow-md transition-all group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`size-8 bg-${card.color}-50 rounded-lg flex items-center justify-center`}>
                    {idx === 0 && <Package className={`size-4 text-${card.color}-600`} />}
                    {idx === 1 && <RefreshCw className={`size-4 text-${card.color}-600`} />}
                    {idx === 2 && <Wallet className={`size-4 text-${card.color}-600`} />}
                    {idx === 3 && <CircleDot className={`size-4 text-${card.color}-600`} />}
                  </div>
                  <ChevronRight className="size-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{card.label}</h3>
                <p className={`text-xl font-black text-${card.color}-600 tracking-tight`}>{formatNumber(card.val)} đ</p>
                <p className="text-[10px] text-gray-400 font-medium italic mt-1">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Result Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl p-8 text-center text-white shadow-xl shadow-amber-100 border-4 border-white relative overflow-hidden mb-12"
          >
            <div className="relative z-10">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-4 opacity-90 text-amber-50">🔥 Ước tính điểm hòa vốn</h4>
              <p className="text-6xl md:text-8xl font-black tracking-tighter mb-2 drop-shadow-xl">
                {calculations.daysToCover === Infinity ? 'N/A' : calculations.daysToCover} <span className="text-2xl md:text-3xl font-bold opacity-80 uppercase">ngày</span>
              </p>
              <p className="text-sm font-bold text-amber-100 italic">Dựa trên lì xì phát sinh đều đặn mỗi ngày</p>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 size-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 size-48 bg-amber-200/20 rounded-full -ml-24 -mb-24 blur-3xl"></div>
          </motion.div>

          {/* Extra Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
             <div className="text-center group">
               <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">LÌ xì / ngày 1</h5>
               <p className="text-xl font-black text-blue-600 tabular-nums group-hover:scale-110 transition-transform">{formatNumber(calculations.dailyLixi1)} đ</p>
             </div>
             <div className="text-center group">
               <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">TỔNG LÌ XÌ (365 NGÀY)</h5>
               <p className="text-xl font-black text-green-600 tabular-nums group-hover:scale-110 transition-transform">{formatNumber(calculations.accumCash)} đ</p>
             </div>
             <div className="text-center group">
               <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">LỢI NHUẬN RÒNG (ROI)</h5>
               <p className={`text-xl font-black tabular-nums group-hover:scale-110 transition-transform ${calculations.roi >= 0 ? 'text-purple-600' : 'text-red-600'}`}>{formatPercent(calculations.roi)}</p>
             </div>
             <div className="text-center group">
               <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">MỤC TIÊU CẦN BÙ</h5>
               <p className="text-xl font-black text-gray-900 tabular-nums group-hover:scale-110 transition-transform">{formatNumber(calculations.needToCover)} đ</p>
             </div>
          </div>

          {/* Timeline Table */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <ChevronRight className="size-4 text-blue-400" />
                Lịch Trình Tích Lũy Dòng Tiền (365 Ngày)
              </h3>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Dự phóng theo ngày
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-20 border-b border-gray-100">
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                    <th className="px-6 py-4">Ngày</th>
                    <th className="px-4 py-4 text-right">Số dư đầu</th>
                    <th className="px-4 py-4 text-right">Lì xì thực nhận</th>
                    <th className="px-4 py-4 text-right">Tích lũy tiền mặt</th>
                    <th className="px-4 py-4 text-right">Số dư cuối</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {calculations.timeline.map((row) => (
                    <tr 
                      key={row.day} 
                      className={`group transition-colors ${row.isBreakeven ? 'bg-green-50/50 hover:bg-green-100/50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-3 text-xs font-bold text-gray-400 group-hover:text-gray-900 transition-colors">{row.day}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-600 text-right tabular-nums">{formatNumber(row.start)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-blue-600 text-right tabular-nums">+{formatNumber(row.gen)}</td>
                      <td className="px-4 py-3 text-xs font-black text-gray-900 text-right tabular-nums group-hover:scale-105 transition-transform">{formatNumber(row.accum)}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-400 text-right tabular-nums">{formatNumber(row.end)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase ${row.isBreakeven ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {row.isBreakeven ? (
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="size-3" />
                              Hòa Vốn
                            </span>
                          ) : (
                            `Còn thiếu ${formatNumber(calculations.needToCover - row.accum)}`
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8"
            >
              <div className="text-center mb-8">
                <div className="size-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="size-8" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Admin Login</h3>
                <p className="text-sm text-gray-500 font-medium">Truy cập để tùy chỉnh hệ số hệ thống</p>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-3 font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm mb-4"
              >
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c3.24 0 5.97-1.09 7.96-2.93l-3.57-2.77c-1.01.67-2.31 1.07-4.39 1.07-3.38 0-6.24-2.29-7.27-5.38H1.14v2.94C3.11 19.86 7.24 23 12 23z"/><path fill="#FBBC05" d="M4.73 13.99c-.27-.81-.42-1.68-.42-2.59s.15-1.78.42-2.59V8.87H1.14C.41 10.34 0 11.97 0 13.7c0 1.73.41 3.36 1.14 4.83l3.59-2.84z"/><path fill="#EA4335" d="M12 4.45c1.76 0 3.35.61 4.59 1.79l3.43-3.43C17.96 1.09 15.24 0 12 0 7.24 0 3.11 3.14 1.14 6.94l3.59 2.84c1.03-3.09 3.89-5.38 7.27-5.38z"/></svg>
                Google Login
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-gray-100 flex-1"></div>
                <span className="text-[10px] font-black text-gray-300 uppercase letter-spacing-widest">hoặc</span>
                <div className="h-px bg-gray-100 flex-1"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email</label>
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Mật khẩu</label>
                  <input 
                    type="password" 
                    value={loginPwd}
                    onChange={(e) => setLoginPwd(e.target.value)}
                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="••••••••"
                  />
                </div>
                {loginError && <p className="text-[10px] text-red-500 font-bold text-center">{loginError}</p>}
                <button 
                  type="submit"
                  className="w-full h-12 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all mt-4"
                >
                  Đăng nhập ngay
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Admin Info) */}
      {user && (
        <div className="fixed bottom-6 right-6 z-40 bg-gray-900 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold backdrop-blur-md">
          <ShieldCheck className="size-3 text-blue-400" />
          Admin Mode: {adminMode ? 'ON' : 'OFF'}
        </div>
      )}
    </div>
  );
}

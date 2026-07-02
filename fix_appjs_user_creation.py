with open('app.js', 'r') as f:
    content = f.read()

old_logic = """            } else {
              const isSuperAdmin =
                user.email === "vinh.ngtienmdb@gmail.com" ||
                user.email === "admin@admin.com";
              await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName || user.email,
                role: isSuperAdmin ? "admin" : "user",
                createdAt: serverTimestamp(),
                status: isSuperAdmin ? "approved" : "new",
                isProfileComplete: isSuperAdmin ? true : false,
              });
            }"""

new_logic = """            } else {
              const isSuperAdmin =
                user.email === "vinh.ngtienmdb@gmail.com" ||
                user.email === "admin@admin.com";
              let defaultRank = "gd";
              try {
                const configSnap = await getDoc(doc(db, "configs", "main"));
                if (configSnap.exists() && configSnap.data().p_defaultUserRank) {
                   defaultRank = configSnap.data().p_defaultUserRank;
                }
              } catch(e) { console.error("Could not fetch default rank", e); }
              
              await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName || user.email,
                role: isSuperAdmin ? "admin" : "user",
                defaultRank: defaultRank,
                createdAt: serverTimestamp(),
                status: isSuperAdmin ? "approved" : "new",
                isProfileComplete: isSuperAdmin ? true : false,
              });
            }"""

content = content.replace(old_logic, new_logic)

old_logic2 = """            const isSuperAdmin =
              user.email === "vinh.ngtienmdb@gmail.com" ||
              user.email === "admin@admin.com";
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || user.email,
              role: isSuperAdmin ? "admin" : "user",
              createdAt: serverTimestamp(),
              status: isSuperAdmin ? "approved" : "new",
              isProfileComplete: isSuperAdmin ? true : false,
            });"""

new_logic2 = """            const isSuperAdmin =
              user.email === "vinh.ngtienmdb@gmail.com" ||
              user.email === "admin@admin.com";
            let defaultRank = "gd";
            try {
              const configSnap = await getDoc(doc(db, "configs", "main"));
              if (configSnap.exists() && configSnap.data().p_defaultUserRank) {
                 defaultRank = configSnap.data().p_defaultUserRank;
              }
            } catch(e) {}
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || user.email,
              role: isSuperAdmin ? "admin" : "user",
              defaultRank: defaultRank,
              createdAt: serverTimestamp(),
              status: isSuperAdmin ? "approved" : "new",
              isProfileComplete: isSuperAdmin ? true : false,
            });"""

content = content.replace(old_logic2, new_logic2)

with open('app.js', 'w') as f:
    f.write(content)

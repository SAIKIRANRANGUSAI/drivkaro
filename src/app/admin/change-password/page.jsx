"use client";

import { useState } from "react";

export default function ChangePassword() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ oldPass, newPass }),
    });

    setMsg(res.ok ? "Password updated!" : "Old password wrong");
  };

  return (
    <div>
      <h2>Change Password</h2>

      <input type="password" placeholder="Old Password"
        value={oldPass} onChange={(e) => setOldPass(e.target.value)}
      /><br />

      <input type="password" placeholder="New Password"
        value={newPass} onChange={(e) => setNewPass(e.target.value)}
      /><br />

      <button onClick={submit}>Update</button>

      {msg && <p>{msg}</p>}
    </div>
  );
}

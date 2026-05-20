import { useState, useMemo } from "react";

const initialData = [
  { id: 1, name: "Mango Tree", category: "Fruit Trees", type: "tree", stock: 45, price: 850, unit: "piece", status: "In Stock", added: "2026-01-10" },
  { id: 2, name: "Rose Bush", category: "Flowering Plants", type: "plant", stock: 120, price: 150, unit: "piece", status: "In Stock", added: "2026-02-01" },
  { id: 3, name: "Tulsi / Holy Basil", category: "Herbs", type: "plant", stock: 200, price: 40, unit: "piece", status: "In Stock", added: "2026-01-15" },
  { id: 4, name: "Gulmohar Tree", category: "Shade Trees", type: "tree", stock: 18, price: 1200, unit: "piece", status: "Low Stock", added: "2026-03-05" },
  { id: 5, name: "Cactus (Barrel)", category: "Succulents", type: "plant", stock: 75, price: 200, unit: "piece", status: "In Stock", added: "2026-02-20" },
  { id: 6, name: "Bamboo", category: "Bamboo & Grass", type: "plant", stock: 5, price: 500, unit: "bunch", status: "Low Stock", added: "2026-01-25" },
  { id: 7, name: "Neem Tree", category: "Medicinal Trees", type: "tree", stock: 30, price: 600, unit: "piece", status: "In Stock", added: "2026-03-01" },
  { id: 8, name: "Monstera Deliciosa", category: "Indoor Plants", type: "plant", stock: 0, price: 450, unit: "piece", status: "Out of Stock", added: "2026-02-10" },
];

const CATEGORIES = ["All", "Fruit Trees", "Flowering Plants", "Herbs", "Shade Trees", "Succulents", "Bamboo & Grass", "Medicinal Trees", "Indoor Plants"];
const TYPES = ["All", "tree", "plant"];

const statusColor = (s) => s === "In Stock" ? "#4ade80" : s === "Low Stock" ? "#facc15" : "#f87171";
const statusBg = (s) => s === "In Stock" ? "#052e16" : s === "Low Stock" ? "#1c1917" : "#1f0202";
const getStatus = (stock) => stock === 0 ? "Out of Stock" : stock <= 10 ? "Low Stock" : "In Stock";

const isMobile = window.innerWidth < 640;

export default function App() {
  const [items, setItems] = useState(() => {
    try { const s = localStorage.getItem("greenstock"); return s ? JSON.parse(s) : initialData; } catch { return initialData; }
  });
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [view, setView] = useState("dashboard");
  const [editItem, setEditItem] = useState(null);
  const [saleModal, setSaleModal] = useState(null);
  const [saleQty, setSaleQty] = useState("");
  const [salesLog, setSalesLog] = useState(() => {
    try { const s = localStorage.getItem("greenstock_sales"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showSuccess, setShowSuccess] = useState("");
  const [form, setForm] = useState({ name: "", category: "Fruit Trees", type: "tree", stock: "", price: "", unit: "piece" });

  const save = (newItems, newSales) => {
    try {
      if (newItems) localStorage.setItem("greenstock", JSON.stringify(newItems));
      if (newSales) localStorage.setItem("greenstock_sales", JSON.stringify(newSales));
    } catch {}
  };

  const flash = (msg) => { setShowSuccess(msg); setTimeout(() => setShowSuccess(""), 2500); };

  const filtered = useMemo(() => items.filter(i => {
    return i.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterCat === "All" || i.category === filterCat) &&
      (filterType === "All" || i.type === filterType);
  }), [items, search, filterCat, filterType]);

  const totalValue = items.reduce((a, b) => a + b.stock * b.price, 0);
  const totalStock = items.reduce((a, b) => a + b.stock, 0);
  const lowStock = items.filter(i => i.status !== "In Stock").length;
  const totalSales = salesLog.reduce((a, b) => a + b.total, 0);

  const handleAdd = () => {
    if (!form.name || !form.stock || !form.price) return;
    const stock = parseInt(form.stock);
    const newItem = { id: Date.now(), ...form, stock, price: parseFloat(form.price), status: getStatus(stock), added: new Date().toISOString().slice(0, 10) };
    const updated = [newItem, ...items];
    setItems(updated); save(updated, null);
    setForm({ name: "", category: "Fruit Trees", type: "tree", stock: "", price: "", unit: "piece" });
    flash("✅ Added to inventory!"); setView("inventory");
  };

  const saveEdit = () => {
    const updated = items.map(i => i.id === editItem.id
      ? { ...editItem, stock: parseInt(editItem.stock), price: parseFloat(editItem.price), status: getStatus(parseInt(editItem.stock)) } : i);
    setItems(updated); save(updated, null); setEditItem(null); flash("✅ Record updated!");
  };

  const handleDelete = (id) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated); save(updated, null); flash("🗑 Removed from inventory.");
  };

  const handleSale = () => {
    const qty = parseInt(saleQty);
    if (!qty || qty <= 0 || qty > saleModal.stock) return;
    const updated = items.map(i => {
      if (i.id !== saleModal.id) return i;
      const newStock = i.stock - qty;
      return { ...i, stock: newStock, status: getStatus(newStock) };
    });
    const newLog = [{ id: Date.now(), name: saleModal.name, qty, price: saleModal.price, total: qty * saleModal.price, date: new Date().toLocaleDateString("en-IN") }, ...salesLog];
    setItems(updated); setSalesLog(newLog); save(updated, newLog);
    setSaleModal(null); setSaleQty(""); flash(`✅ Sale: ${qty} × ${saleModal.name}`);
  };

  const navItems = [
    { key: "dashboard", icon: "🌿", label: "Dashboard" },
    { key: "inventory", icon: "🌳", label: "Inventory" },
    { key: "add", icon: "➕", label: "Add New" },
    { key: "sales", icon: "📊", label: "Sales" },
  ];

  const s = {
    app: { minHeight: "100vh", background: "#0a0f0a", fontFamily: "'Georgia', serif", color: "#e8f5e9" },
    header: { background: "linear-gradient(135deg,#0d1f0d,#0a0f0a)", borderBottom: "1px solid #1a3d1a", padding: isMobile ? "14px 16px" : "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { fontFamily: "'Georgia', serif", fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#4ade80" },
    layout: { display: "flex", minHeight: "calc(100vh - 70px)" },
    sidebar: isMobile
      ? { display: "flex", background: "#070d07", borderTop: "1px solid #1a3d1a", padding: "8px 4px", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, justifyContent: "space-around" }
      : { width: 190, background: "#070d07", borderRight: "1px solid #1a3d1a", padding: "20px 10px", display: "flex", flexDirection: "column", gap: 5 },
    main: { flex: 1, padding: isMobile ? "16px 14px 80px" : "28px 32px", overflowY: "auto" },
    card: { background: "#0d1a0d", border: "1px solid #1a3d1a", borderRadius: 14, padding: isMobile ? "14px" : "20px 22px" },
    input: { width: "100%", background: "#070d07", border: "1px solid #2d5a27", borderRadius: 10, color: "#e8f5e9", fontFamily: "inherit", fontSize: 14, padding: "10px 13px" },
    select: { width: "100%", background: "#070d07", border: "1px solid #2d5a27", borderRadius: 10, color: "#e8f5e9", fontFamily: "inherit", fontSize: 14, padding: "10px 13px" },
    btn: (bg, border, color) => ({ background: bg, border: `1px solid ${border}`, borderRadius: 9, color, fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "10px 16px", cursor: "pointer" }),
    label: { fontFamily: "inherit", fontSize: 12, color: "#4ade80", fontWeight: 600, display: "block", marginBottom: 6 },
    title: { fontFamily: "'Georgia', serif", fontSize: isMobile ? 20 : 26, fontWeight: 700, color: "#bbf7d0", marginBottom: isMobile ? 16 : 22 },
  };

  return (
    <div style={s.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input,select { outline: none; } input:focus,select:focus { border-color: #4ade80 !important; }
        button { transition: opacity 0.15s; } button:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #2d5a27; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        th,td { padding: 10px 12px; text-align: left; }
        tr { border-bottom: 1px solid #111d11; }
        tr:hover td { background: #0d1a0d; }
      `}</style>

      {/* Toast */}
      {showSuccess && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, background: "#14532d", border: "1px solid #4ade80", borderRadius: 10, padding: "11px 18px", color: "#bbf7d0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(74,222,128,0.3)" }}>
          {showSuccess}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌱</span>
          <div>
            <div style={s.logo}>GreenStock</div>
            {!isMobile && <div style={{ fontSize: 11, color: "#6b9e6b", fontFamily: "'DM Sans',sans-serif" }}>Nursery Inventory Manager</div>}
          </div>
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#6b9e6b", background: "#0d1a0d", padding: "5px 12px", borderRadius: 20, border: "1px solid #1a3d1a" }}>
          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      <div style={s.layout}>
        {/* Sidebar / Bottom Nav */}
        <div style={s.sidebar}>
          {navItems.map(n => (
            <button key={n.key} onClick={() => setView(n.key)} style={{
              background: view === n.key ? "#1a3d1a" : "transparent",
              border: view === n.key ? "1px solid #2d5a27" : "1px solid transparent",
              borderRadius: 10, padding: isMobile ? "8px 14px" : "10px 14px",
              color: view === n.key ? "#4ade80" : "#6b9e6b",
              display: "flex", flexDirection: isMobile ? "column" : "row",
              alignItems: "center", gap: isMobile ? 3 : 8,
              fontFamily: "'DM Sans',sans-serif", fontSize: isMobile ? 10 : 13,
              fontWeight: 500, cursor: "pointer", width: isMobile ? "auto" : "100%",
              minWidth: isMobile ? 60 : "auto"
            }}>
              <span style={{ fontSize: isMobile ? 20 : 17 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>

        {/* Main */}
        <div style={s.main}>

          {/* DASHBOARD */}
          {view === "dashboard" && (
            <div>
              <div style={s.title}>📊 Dashboard</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Varieties", value: items.length, icon: "🌱", color: "#4ade80" },
                  { label: "Total Stock", value: totalStock.toLocaleString(), icon: "📦", color: "#60a5fa" },
                  { label: "Inv. Value", value: `₹${(totalValue / 1000).toFixed(1)}k`, icon: "💰", color: "#fbbf24" },
                  { label: "Need Attention", value: lowStock, icon: "⚠️", color: "#f87171" },
                ].map((s2, i) => (
                  <div key={i} style={{ ...s.card, textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{s2.icon}</div>
                    <div style={{ fontFamily: "'Georgia',serif", fontSize: isMobile ? 22 : 26, fontWeight: 700, color: s2.color }}>{s2.value}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#6b9e6b", marginTop: 3 }}>{s2.label}</div>
                  </div>
                ))}
              </div>

              {/* Sales Revenue card */}
              <div style={{ ...s.card, marginBottom: 16 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#60a5fa", fontWeight: 600, marginBottom: 4 }}>💰 TOTAL SALES REVENUE</div>
                <div style={{ fontFamily: "'Georgia',serif", fontSize: 28, color: "#60a5fa", fontWeight: 700 }}>₹{totalSales.toLocaleString()}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#6b9e6b" }}>from {salesLog.length} transactions</div>
              </div>

              {/* Low Stock Alerts */}
              <div style={s.card}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: "#facc15", marginBottom: 14, fontSize: 14 }}>⚠️ Low / Out of Stock</div>
                {items.filter(i => i.status !== "In Stock").length === 0
                  ? <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#6b9e6b" }}>All items well stocked ✅</div>
                  : items.filter(i => i.status !== "In Stock").map(i => (
                    <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1a3d1a" }}>
                      <div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#e8f5e9" }}>{i.name}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#6b9e6b" }}>{i.category}</div>
                      </div>
                      <span style={{ background: statusBg(i.status), color: statusColor(i.status), border: `1px solid ${statusColor(i.status)}50`, borderRadius: 20, padding: "3px 10px", fontFamily: "'DM Sans',sans-serif", fontSize: 11 }}>
                        {i.stock} left
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* INVENTORY */}
          {view === "inventory" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={s.title}>🌳 Inventory</div>
                <button onClick={() => setView("add")} style={s.btn("#14532d", "#4ade80", "#4ade80")}>+ Add New</button>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...s.input, width: isMobile ? "100%" : 220 }} />
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...s.select, width: isMobile ? "100%" : "auto" }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...s.select, width: isMobile ? "100%" : "auto" }}>
                  {TYPES.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t === "tree" ? "🌳 Trees" : "🌿 Plants"}</option>)}
                </select>
              </div>

              {isMobile ? (
                // Mobile card view
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filtered.map(item => (
                    <div key={item.id} style={{ ...s.card, borderLeft: `3px solid ${statusColor(item.status)}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 15, color: "#e8f5e9" }}>{item.name}</div>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#6b9e6b" }}>{item.category} · {item.type === "tree" ? "🌳" : "🌿"}</div>
                        </div>
                        <span style={{ background: statusBg(item.status), color: statusColor(item.status), border: `1px solid ${statusColor(item.status)}50`, borderRadius: 20, padding: "3px 10px", fontFamily: "'DM Sans',sans-serif", fontSize: 11, height: "fit-content" }}>
                          {item.status}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}>
                          <div style={{ color: "#6b9e6b", marginBottom: 2 }}>Stock</div>
                          <div style={{ color: statusColor(item.status), fontWeight: 700, fontSize: 16 }}>{item.stock}</div>
                        </div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}>
                          <div style={{ color: "#6b9e6b", marginBottom: 2 }}>Price</div>
                          <div style={{ color: "#fbbf24" }}>₹{item.price}</div>
                        </div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}>
                          <div style={{ color: "#6b9e6b", marginBottom: 2 }}>Value</div>
                          <div style={{ color: "#60a5fa" }}>₹{(item.stock * item.price).toLocaleString()}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { setSaleModal(item); setSaleQty(""); }} style={{ ...s.btn("#052e16", "#166534", "#4ade80"), flex: 1, fontSize: 12 }}>💵 Sell</button>
                        <button onClick={() => setEditItem({ ...item })} style={{ ...s.btn("#0c1a2e", "#1e3a5f", "#60a5fa"), fontSize: 12 }}>✏️ Edit</button>
                        <button onClick={() => handleDelete(item.id)} style={{ ...s.btn("#1f0202", "#7f1d1d", "#f87171"), fontSize: 12 }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop table view
                <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
                  <table>
                    <thead>
                      <tr style={{ background: "#070d07" }}>
                        {["Name", "Category", "Type", "Stock", "Price", "Value", "Status", "Actions"].map(h => (
                          <th key={h} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#4ade80", letterSpacing: 1, fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(item => (
                        <tr key={item.id}>
                          <td><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#e8f5e9", fontWeight: 500 }}>{item.name}</div><div style={{ fontSize: 11, color: "#6b9e6b" }}>{item.added}</div></td>
                          <td style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#a3c8a3" }}>{item.category}</td>
                          <td style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>{item.type === "tree" ? "🌳 Tree" : "🌿 Plant"}</td>
                          <td style={{ fontFamily: "'Georgia',serif", fontSize: 16, color: statusColor(item.status), fontWeight: 700 }}>{item.stock} <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#6b9e6b", fontWeight: 400 }}>{item.unit}s</span></td>
                          <td style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#fbbf24" }}>₹{item.price}</td>
                          <td style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#60a5fa" }}>₹{(item.stock * item.price).toLocaleString()}</td>
                          <td><span style={{ background: statusBg(item.status), color: statusColor(item.status), border: `1px solid ${statusColor(item.status)}40`, borderRadius: 20, padding: "4px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 11 }}>{item.status}</span></td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => { setSaleModal(item); setSaleQty(""); }} style={s.btn("#052e16", "#166534", "#4ade80")}>Sell</button>
                              <button onClick={() => setEditItem({ ...item })} style={s.btn("#0c1a2e", "#1e3a5f", "#60a5fa")}>Edit</button>
                              <button onClick={() => handleDelete(item.id)} style={s.btn("#1f0202", "#7f1d1d", "#f87171")}>Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", fontFamily: "'DM Sans',sans-serif", color: "#6b9e6b" }}>🌾 No items found.</div>}
                </div>
              )}
            </div>
          )}

          {/* ADD NEW */}
          {view === "add" && (
            <div style={{ maxWidth: 520 }}>
              <div style={s.title}>➕ Add Plant / Tree</div>
              <div style={{ ...s.card, display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Plant / Tree Name *", key: "name", type: "text", placeholder: "e.g. Mango Tree, Rose Bush" },
                  { label: "Price per Unit (₹) *", key: "price", type: "number", placeholder: "e.g. 500" },
                  { label: "Stock Quantity *", key: "stock", type: "number", placeholder: "e.g. 100" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={s.label}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={s.input} />
                  </div>
                ))}
                {[
                  { label: "Category", key: "category", opts: CATEGORIES.filter(c => c !== "All") },
                  { label: "Type", key: "type", opts: ["tree", "plant"] },
                  { label: "Unit", key: "unit", opts: ["piece", "bunch", "pot", "tray", "bag"] },
                ].map(f => (
                  <div key={f.key}>
                    <label style={s.label}>{f.label}</label>
                    <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={s.select}>
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={handleAdd} style={{ ...s.btn("#14532d", "#4ade80", "#4ade80"), flex: 1, fontSize: 15 }}>✅ Add to Inventory</button>
                  <button onClick={() => setView("inventory")} style={s.btn("#1a1a1a", "#2d5a27", "#6b9e6b")}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* SALES LOG */}
          {view === "sales" && (
            <div>
              <div style={s.title}>📊 Sales Log</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={s.card}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#6b9e6b" }}>Transactions</div>
                  <div style={{ fontFamily: "'Georgia',serif", fontSize: 26, color: "#4ade80" }}>{salesLog.length}</div>
                </div>
                <div style={s.card}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#6b9e6b" }}>Total Revenue</div>
                  <div style={{ fontFamily: "'Georgia',serif", fontSize: 26, color: "#fbbf24" }}>₹{totalSales.toLocaleString()}</div>
                </div>
              </div>
              {salesLog.length === 0
                ? <div style={{ ...s.card, textAlign: "center", color: "#6b9e6b", fontFamily: "'DM Sans',sans-serif", padding: 40 }}>No sales yet. Record a sale from Inventory!</div>
                : isMobile ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {salesLog.map(s2 => (
                      <div key={s2.id} style={s.card}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#e8f5e9", fontWeight: 600 }}>{s2.name}</div>
                          <div style={{ fontFamily: "'Georgia',serif", fontSize: 16, color: "#fbbf24" }}>₹{s2.total.toLocaleString()}</div>
                        </div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#6b9e6b", marginTop: 4 }}>
                          {s2.qty} units × ₹{s2.price} &nbsp;·&nbsp; {s2.date}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
                    <table>
                      <thead><tr style={{ background: "#070d07" }}>
                        {["Date", "Item", "Qty", "Unit Price", "Total"].map(h => <th key={h} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#4ade80", textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {salesLog.map(s2 => (
                          <tr key={s2.id}>
                            <td style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#6b9e6b" }}>{s2.date}</td>
                            <td style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#e8f5e9", fontWeight: 500 }}>{s2.name}</td>
                            <td style={{ fontFamily: "'Georgia',serif", fontSize: 16, color: "#4ade80" }}>{s2.qty}</td>
                            <td style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#a3c8a3" }}>₹{s2.price}</td>
                            <td style={{ fontFamily: "'Georgia',serif", fontSize: 16, color: "#fbbf24", fontWeight: 700 }}>₹{s2.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ ...s.card, width: "100%", maxWidth: 400 }}>
            <div style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: "#bbf7d0", marginBottom: 18 }}>✏️ Edit — {editItem.name}</div>
            {[{ label: "Name", key: "name", type: "text" }, { label: "Price (₹)", key: "price", type: "number" }, { label: "Stock Qty", key: "stock", type: "number" }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={s.label}>{f.label}</label>
                <input type={f.type} value={editItem[f.key]} onChange={e => setEditItem(p => ({ ...p, [f.key]: e.target.value }))} style={s.input} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button onClick={saveEdit} style={{ ...s.btn("#14532d", "#4ade80", "#4ade80"), flex: 1 }}>Save Changes</button>
              <button onClick={() => setEditItem(null)} style={s.btn("#1a1a1a", "#2d5a27", "#6b9e6b")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {saleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ ...s.card, width: "100%", maxWidth: 380 }}>
            <div style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: "#bbf7d0", marginBottom: 6 }}>💵 Record Sale</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#6b9e6b", marginBottom: 18 }}>
              {saleModal.name} — <span style={{ color: "#4ade80" }}>{saleModal.stock} in stock</span>
            </div>
            <label style={s.label}>Quantity Sold</label>
            <input type="number" min="1" max={saleModal.stock} placeholder={`Max: ${saleModal.stock}`}
              value={saleQty} onChange={e => setSaleQty(e.target.value)} style={{ ...s.input, fontSize: 18, marginBottom: 12 }} />
            {saleQty && parseInt(saleQty) > 0 && (
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#fbbf24", marginBottom: 16 }}>
                Revenue: ₹{(parseInt(saleQty) * saleModal.price).toLocaleString()}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSale} style={{ ...s.btn("#14532d", "#4ade80", "#4ade80"), flex: 1 }}>✅ Confirm Sale</button>
              <button onClick={() => setSaleModal(null)} style={s.btn("#1a1a1a", "#2d5a27", "#6b9e6b")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

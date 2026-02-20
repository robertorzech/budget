import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { name: "Czynsz", icon: "🏠" },
  { name: "Kredyt", icon: "🏦" },
  { name: "TV/Tel", icon: "📱" },
  { name: "Subskrypcje", icon: "🔄" },
  { name: "Pinki", icon: "🎀" },
  { name: "Igor lekarz", icon: "🩺" },
  { name: "Igor Socatots", icon: "⚽" },
  { name: "Prąd", icon: "⚡" },
  { name: "Paliwo", icon: "⛽" },
  { name: "Żłobek", icon: "🍼" },
  { name: "Fryzjer", icon: "✂️" },
  { name: "Soczewki", icon: "👁️" },
  { name: "Auto", icon: "🚗" },
  { name: "Zakupy odzież", icon: "👕" },
  { name: "Zakupy spożywcze", icon: "🛒" },
  { name: "Apteka", icon: "💊" },
  { name: "Inne", icon: "📦" },
];

const STORAGE_KEY = "budget_expenses_v1";
const CAT_KEY = "budget_categories_v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadCats() {
  try {
    const raw = localStorage.getItem(CAT_KEY);
    return raw ? JSON.parse(raw) : CATEGORIES;
  } catch { return CATEGORIES; }
}

function saveCats(cats) {
  localStorage.setItem(CAT_KEY, JSON.stringify(cats));
}

function formatPLN(amount) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(amount);
}

function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key) {
  const [year, month] = key.split("-");
  const months = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export default function App() {
  const [expenses, setExpenses] = useState(loadData);
  const [categories, setCategories] = useState(loadCats);
  const [view, setView] = useState("dashboard"); // dashboard | add | category
  const [selectedCat, setSelectedCat] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => getMonthKey(new Date()));
  const [form, setForm] = useState({ category: "", description: "", amount: "" });
  const [newCatName, setNewCatName] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const amountRef = useRef();

  useEffect(() => { saveData(expenses); }, [expenses]);
  useEffect(() => { saveCats(categories); }, [categories]);

  const monthExpenses = expenses.filter(e => getMonthKey(e.date) === currentMonth);

  const allMonths = [...new Set(expenses.map(e => getMonthKey(e.date)))].sort().reverse();
  if (!allMonths.includes(currentMonth)) allMonths.unshift(currentMonth);

  const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = categories.map(cat => {
    const items = monthExpenses.filter(e => e.category === cat.name);
    const total = items.reduce((s, e) => s + e.amount, 0);
    return { ...cat, items, total };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  function addExpense() {
    if (!form.category || !form.amount || isNaN(parseFloat(form.amount))) return;
    const expense = {
      id: Date.now(),
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount.replace(",", ".")),
      date: new Date().toISOString(),
    };
    setExpenses(prev => [expense, ...prev]);
    setForm({ category: form.category, description: "", amount: "" });
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
    setCurrentMonth(getMonthKey(new Date()));
  }

  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDeleteId(null);
  }

  function addCategory() {
    if (!newCatName.trim()) return;
    const cat = { name: newCatName.trim(), icon: "🏷️" };
    setCategories(prev => [...prev, cat]);
    setForm(f => ({ ...f, category: cat.name }));
    setNewCatName("");
    setShowNewCat(false);
  }

  const monthIdx = allMonths.indexOf(currentMonth);

  const catDetail = selectedCat
    ? { ...selectedCat, items: expenses.filter(e => e.category === selectedCat.name).sort((a, b) => new Date(b.date) - new Date(a.date)) }
    : null;

  return (
    <div style={styles.root}>
      <style>{css}</style>
      {/* Status bar */}
      <div style={styles.statusBar}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11 }}>●●●</span>
          <span style={{ fontSize: 11 }}>▲</span>
          <span style={{ fontSize: 11 }}>🔋</span>
        </div>
      </div>

      {/* Header */}
      <div style={styles.header}>
        {(view === "category") && (
          <button style={styles.backBtn} onClick={() => { setView("dashboard"); setSelectedCat(null); }}>
            ‹ Powrót
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div style={styles.headerTitle}>
            {view === "dashboard" ? "Budżet domowy" :
             view === "add" ? "Dodaj wydatek" :
             `${selectedCat?.icon} ${selectedCat?.name}`}
          </div>
          {view === "dashboard" && (
            <div style={styles.headerSub}>
              {getMonthLabel(currentMonth)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={styles.scroll}>
        {view === "dashboard" && (
          <>
            {/* Month selector */}
            <div style={styles.monthNav}>
              <button
                style={{ ...styles.navArrow, opacity: monthIdx >= allMonths.length - 1 ? 0.3 : 1 }}
                disabled={monthIdx >= allMonths.length - 1}
                onClick={() => setCurrentMonth(allMonths[monthIdx + 1])}
              >‹</button>
              <span style={styles.monthLabel}>{getMonthLabel(currentMonth)}</span>
              <button
                style={{ ...styles.navArrow, opacity: monthIdx <= 0 ? 0.3 : 1 }}
                disabled={monthIdx <= 0}
                onClick={() => setCurrentMonth(allMonths[monthIdx - 1])}
              >›</button>
            </div>

            {/* Total card */}
            <div style={styles.totalCard}>
              <div style={styles.totalLabel}>Wydatki miesięczne</div>
              <div style={styles.totalAmount}>{formatPLN(totalMonth)}</div>
              <div style={styles.totalSub}>{monthExpenses.length} transakcji</div>
            </div>

            {/* Category list */}
            <div style={styles.sectionTitle}>Wydatki wg kategorii</div>
            {byCategory.length === 0 && (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 48 }}>💰</div>
                <div style={{ color: "#8e9bae", marginTop: 8 }}>Brak wydatków w tym miesiącu</div>
              </div>
            )}
            <div style={styles.listCard}>
              {byCategory.map((cat, i) => {
                const pct = totalMonth > 0 ? (cat.total / totalMonth) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div
                      style={styles.catRow}
                      className="pressable"
                      onClick={() => { setSelectedCat(cat); setView("category"); }}
                    >
                      <div style={styles.catIcon}>{cat.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.catName}>{cat.name}</div>
                        <div style={styles.progressBar}>
                          <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={styles.catAmount}>{formatPLN(cat.total)}</div>
                        <div style={styles.catCount}>{cat.items.length} szt.</div>
                      </div>
                      <div style={styles.chevron}>›</div>
                    </div>
                    {i < byCategory.length - 1 && <div style={styles.divider} />}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === "add" && (
          <div style={{ padding: "0 16px 32px" }}>
            {addSuccess && (
              <div style={styles.successBanner}>
                ✅ Wydatek dodany!
              </div>
            )}

            <div style={styles.formCard}>
              {/* Category */}
              <div style={styles.formField}>
                <div style={styles.fieldLabel}>Kategoria</div>
                <select
                  style={styles.select}
                  value={form.category}
                  onChange={e => {
                    if (e.target.value === "__new__") setShowNewCat(true);
                    else setForm(f => ({ ...f, category: e.target.value }));
                  }}
                >
                  <option value="">Wybierz kategorię...</option>
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                  <option value="__new__">➕ Dodaj nową kategorię</option>
                </select>
              </div>

              {showNewCat && (
                <div style={{ ...styles.formField, background: "#f0f5ff", borderRadius: 12, padding: 12 }}>
                  <div style={styles.fieldLabel}>Nazwa nowej kategorii</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="np. Hobby"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCategory()}
                    />
                    <button style={styles.addCatBtn} onClick={addCategory}>Dodaj</button>
                  </div>
                </div>
              )}

              <div style={styles.divider} />

              {/* Description */}
              <div style={styles.formField}>
                <div style={styles.fieldLabel}>Opis / Nazwa</div>
                <input
                  style={styles.input}
                  placeholder="np. Biedronka, zakupy tygodniowe"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div style={styles.divider} />

              {/* Amount */}
              <div style={styles.formField}>
                <div style={styles.fieldLabel}>Kwota (PLN)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    ref={amountRef}
                    style={{ ...styles.input, fontSize: 22, fontWeight: 700, color: "#0a4fcf", flex: 1 }}
                    placeholder="0,00"
                    value={form.amount}
                    inputMode="decimal"
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addExpense()}
                  />
                  <span style={{ fontSize: 18, color: "#8e9bae", fontWeight: 600 }}>zł</span>
                </div>
              </div>
            </div>

            <button
              style={{
                ...styles.primaryBtn,
                opacity: form.category && form.amount ? 1 : 0.4,
              }}
              onClick={addExpense}
            >
              Dodaj wydatek
            </button>

            {/* Recent expenses */}
            {monthExpenses.length > 0 && (
              <>
                <div style={{ ...styles.sectionTitle, marginTop: 28 }}>Ostatnie w tym miesiącu</div>
                <div style={styles.listCard}>
                  {monthExpenses.slice(0, 10).map((exp, i) => {
                    const cat = categories.find(c => c.name === exp.category) || { icon: "📦" };
                    return (
                      <div key={exp.id}>
                        <div style={styles.expRow}>
                          <div style={styles.catIcon}>{cat.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={styles.expName}>{exp.description || exp.category}</div>
                            <div style={styles.expMeta}>
                              {exp.category} · {new Date(exp.date).toLocaleDateString("pl-PL")}
                            </div>
                          </div>
                          <div style={styles.expAmount}>{formatPLN(exp.amount)}</div>
                          <button
                            style={styles.deleteBtn}
                            onClick={() => setDeleteId(exp.id)}
                          >✕</button>
                        </div>
                        {i < Math.min(monthExpenses.length, 10) - 1 && <div style={styles.divider} />}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {view === "category" && catDetail && (
          <div style={{ padding: "0 16px 32px" }}>
            {/* Category total */}
            <div style={{ ...styles.totalCard, background: "linear-gradient(135deg, #1a56db 0%, #0a3fa0 100%)" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{catDetail.icon}</div>
              <div style={styles.totalLabel}>{catDetail.name}</div>
              <div style={styles.totalAmount}>
                {formatPLN(catDetail.items.reduce((s, e) => s + e.amount, 0))}
              </div>
              <div style={styles.totalSub}>wszystkie transakcje</div>
            </div>

            <div style={styles.sectionTitle}>Historia</div>
            {catDetail.items.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 40 }}>📭</div>
                <div style={{ color: "#8e9bae", marginTop: 8 }}>Brak transakcji</div>
              </div>
            ) : (
              <div style={styles.listCard}>
                {catDetail.items.map((exp, i) => (
                  <div key={exp.id}>
                    <div style={styles.expRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.expName}>{exp.description || "(brak opisu)"}</div>
                        <div style={styles.expMeta}>
                          {new Date(exp.date).toLocaleDateString("pl-PL", {
                            weekday: "long", day: "numeric", month: "long", year: "numeric"
                          })}
                        </div>
                        <div style={{ fontSize: 11, color: "#b0bec5", marginTop: 2 }}>
                          {getMonthLabel(getMonthKey(exp.date))}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ ...styles.expAmount, fontSize: 17 }}>{formatPLN(exp.amount)}</div>
                      </div>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => setDeleteId(exp.id)}
                      >✕</button>
                    </div>
                    {i < catDetail.items.length - 1 && <div style={styles.divider} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div style={styles.tabBar}>
        <button style={styles.tab} onClick={() => setView("dashboard")}>
          <div style={{ fontSize: 22, filter: view === "dashboard" ? "none" : "grayscale(1) opacity(0.5)" }}>📊</div>
          <div style={{ fontSize: 10, color: view === "dashboard" ? "#1a56db" : "#8e9bae", marginTop: 2, fontWeight: view === "dashboard" ? 700 : 400 }}>
            Dashboard
          </div>
        </button>
        <button
          style={{ ...styles.tab, position: "relative", top: -12 }}
          onClick={() => setView("add")}
        >
          <div style={styles.addFab}>＋</div>
        </button>
        <button style={styles.tab} onClick={() => { setView("dashboard"); setCurrentMonth(getMonthKey(new Date())); }}>
          <div style={{ fontSize: 22, filter: "grayscale(1) opacity(0.5)" }}>📅</div>
          <div style={{ fontSize: 10, color: "#8e9bae", marginTop: 2 }}>Ten miesiąc</div>
        </button>
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div style={styles.overlay} onClick={() => setDeleteId(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalIcon}>🗑️</div>
            <div style={styles.modalTitle}>Usuń wydatek?</div>
            <div style={styles.modalSub}>Tej operacji nie można cofnąć.</div>
            <button style={styles.deleteConfirm} onClick={() => deleteExpense(deleteId)}>
              Usuń
            </button>
            <button style={styles.cancelBtn} onClick={() => setDeleteId(null)}>
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    maxWidth: 430,
    margin: "0 auto",
    background: "#f2f5fb",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    boxShadow: "0 0 60px rgba(26,86,219,0.12)",
  },
  statusBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px 4px",
    background: "linear-gradient(135deg, #1a56db 0%, #0a3fa0 100%)",
    color: "white",
  },
  header: {
    background: "linear-gradient(135deg, #1a56db 0%, #0a3fa0 100%)",
    color: "white",
    padding: "8px 20px 24px",
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: -0.5,
    lineHeight: 1.1,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    fontWeight: 500,
  },
  backBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "white",
    fontSize: 16,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 20,
    cursor: "pointer",
    flexShrink: 0,
    marginBottom: 4,
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    paddingTop: 0,
    paddingBottom: 100,
  },
  monthNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 0",
  },
  navArrow: {
    background: "white",
    border: "none",
    fontSize: 22,
    fontWeight: 700,
    width: 36,
    height: 36,
    borderRadius: 12,
    cursor: "pointer",
    color: "#1a56db",
    boxShadow: "0 2px 8px rgba(26,86,219,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1a2744",
  },
  totalCard: {
    background: "linear-gradient(135deg, #1a56db 0%, #0a3fa0 100%)",
    borderRadius: 24,
    margin: "16px 16px 0",
    padding: "24px 24px 20px",
    color: "white",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(26,86,219,0.35)",
  },
  totalLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 44,
    fontWeight: 800,
    marginTop: 4,
    letterSpacing: -1.5,
  },
  totalSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#8e9bae",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    padding: "20px 20px 8px",
  },
  listCard: {
    background: "white",
    borderRadius: 20,
    margin: "0 16px",
    overflow: "hidden",
    boxShadow: "0 2px 16px rgba(26,86,219,0.07)",
  },
  catRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  catIcon: {
    fontSize: 26,
    width: 44,
    height: 44,
    background: "#f0f5ff",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  catName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a2744",
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    background: "#e8edf8",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #1a56db)",
    borderRadius: 4,
    transition: "width 0.6s ease",
  },
  catAmount: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1a2744",
  },
  catCount: {
    fontSize: 11,
    color: "#8e9bae",
    textAlign: "right",
    marginTop: 2,
  },
  chevron: {
    color: "#c5d0e8",
    fontSize: 20,
    fontWeight: 700,
  },
  divider: {
    height: 1,
    background: "#f0f4fb",
    marginLeft: 72,
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#8e9bae",
    fontSize: 15,
  },
  expRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
  },
  expName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a2744",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  expMeta: {
    fontSize: 12,
    color: "#8e9bae",
    marginTop: 2,
    textTransform: "capitalize",
  },
  expAmount: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1a56db",
    flexShrink: 0,
  },
  deleteBtn: {
    background: "#fee2e2",
    border: "none",
    color: "#ef4444",
    width: 28,
    height: 28,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid #e8edf8",
    display: "flex",
    justifyContent: "space-around",
    padding: "8px 0 20px",
    zIndex: 100,
  },
  tab: {
    background: "none",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    padding: "4px 24px",
    flex: 1,
  },
  addFab: {
    width: 60,
    height: 60,
    background: "linear-gradient(135deg, #1a56db 0%, #0a3fa0 100%)",
    borderRadius: 20,
    color: "white",
    fontSize: 28,
    fontWeight: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 20px rgba(26,86,219,0.4)",
  },
  formCard: {
    background: "white",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 2px 16px rgba(26,86,219,0.07)",
    marginBottom: 16,
  },
  formField: {
    padding: "14px 16px",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8e9bae",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    border: "none",
    background: "transparent",
    fontSize: 16,
    color: "#1a2744",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    border: "none",
    background: "transparent",
    fontSize: 16,
    color: "#1a2744",
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
    padding: 0,
  },
  primaryBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #1a56db 0%, #0a3fa0 100%)",
    color: "white",
    border: "none",
    borderRadius: 16,
    padding: "16px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 6px 20px rgba(26,86,219,0.35)",
    letterSpacing: 0.3,
  },
  addCatBtn: {
    background: "#1a56db",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  successBanner: {
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    textAlign: "center",
    animation: "fadeIn 0.3s ease",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(10,20,50,0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 200,
    padding: "0 16px",
  },
  modal: {
    background: "white",
    borderRadius: "24px 24px 12px 12px",
    padding: "28px 24px 40px",
    width: "100%",
    maxWidth: 430,
    textAlign: "center",
    animation: "slideUp 0.3s ease",
  },
  modalIcon: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 800, color: "#1a2744", marginBottom: 6 },
  modalSub: { fontSize: 14, color: "#8e9bae", marginBottom: 24 },
  deleteConfirm: {
    width: "100%",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "14px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: 10,
  },
  cancelBtn: {
    width: "100%",
    background: "#f0f4fb",
    color: "#1a2744",
    border: "none",
    borderRadius: 14,
    padding: "14px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: #e8edf8; }
  .pressable:active { background: #f5f8ff !important; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }
  select option { font-size: 16px; }
  ::-webkit-scrollbar { display: none; }
`;

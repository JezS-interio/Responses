import { useState, useMemo, useEffect } from "react";
import { Search, Copy, Check, Tag, Plus, X, Trash2 } from "lucide-react";

const DEFAULT_ENTRIES = [
  {
    tag: "Banco / verificación",
    q: "Estamos verificando con el banco",
    a: "We are checking with the bank, as soon as we get a response we will let you know",
  },
  {
    tag: "País funcionando",
    q: "El país funciona bien",
    a: "Hi @, after testing we see that Brazil is working correctly 👍🏻",
  },
  {
    tag: "Credenciales",
    q: "Enviar credenciales de payout o payin",
    a: "Hi @ 👋🏻 I've sent payout credentials to info@tradertok.com",
  },
  {
    tag: "Webhook",
    q: "Que me den un webhook",
    a: "If you could send me the payout webhook where I should send the callbacks, I'll set it up. 👍🏻",
  },
  {
    tag: "Live payout",
    q: "Para cambiar a live payout",
    a: "And once you're ready to switch to the live payout API, just send me a message. 🙌🏻",
  },
  {
    tag: "SFP",
    q: "Pusher a SFP",
    a: "Hi @, has the issue been resolved? Could you please confirm whether it's ok to proceed with payouts? 🙌🏻",
  },
  {
    tag: "Cuenta conjunta",
    q: "Cuando paga otra persona",
    a: "The payment didn't impact, however there's a similar transaction under another name, could you confirm if the client has a joint account? 🙏",
  },
  {
    tag: "Test transactions",
    q: "Explicación a un merchant sobre poner fail a las transacciones de test",
    a: 'Hi @, your statuses are not inconsistent. Once you requested a "settled" callback, we manually updated the transaction. However, after some time, we changed its status back to "declined" so it wouldn\'t get mixed up with future "settled" transactions.\n\nIf you\'d like to test the status request, we can mark the transaction as "settled" again. After you\'ve completed your test, we\'ll change it back to "declined" since it\'s only a test deposit.',
  },
  {
    tag: "Método equivocado",
    q: "Cuando se confunden de método",
    a: "Hi Julian, we received it! But the client sent the payment to the other method (BtsArs) instead of the one the request was created for (S-interio) 🙌🏻. Can you create a new transaction close or equal to the transfer amount, but for the method the client made the transfer to (BtsArs)?",
  },
  {
    tag: "Tipos de flujo",
    q: "Explicación a merchant de tipos de flujos",
    a: "The main difference is that with S2S / H2H integration, the merchant sends the payment request directly through the API and handles more of the payment flow on their side. With checkout integration, the payer is redirected to our hosted checkout/paywall, where the available payment methods are displayed and managed by us.\n\nFor this case, we recommend starting with the checkout integration, because many local payment methods do not support H2H/S2S directly, or they require specific flows like redirection, QR, bank selection, cash payment references, etc.\n\nCheckout is more scalable and easier to maintain because we can support multiple payment methods in one flow without requiring custom development for each method on the merchant side.",
  },
  {
    tag: "Iframe",
    q: "Iframe no soportado",
    a: "Hi @ Iframes are not supported that is why the page is returning this error.",
  },
  {
    tag: "Payout / balance",
    q: "Payout pendiente por falta de balance",
    a: "We have reviewed these transactions, and they are still pending due to insufficient balance 🙌🏽\n-\n-\n-\nWould you like to top up your balance so these transactions can be processed?",
  },
  {
    tag: "Rechazar payout",
    q: "Para rechazar payout",
    a: "Yes, would you like us to reject these three payout transactions?",
  },
  {
    tag: "Redirección / POP",
    q: "Que son redirecciones y si tienen el POP",
    a: "We checked the transaction IDs you shared. They all have Type: Redirect and Status: Success, which means the users were successfully redirected to the payment page.\n\nHowever, it appears that the payments were not completed. If you have any proof of payment for these transactions, we can check it with the bank.",
  },
  {
    tag: "Conexión bancaria",
    q: "Avisar al merchant que las tx tienen problemas de conexión bancaria",
    a: "We noticed that some transactions are showing a bank connection error. We are currently investigating this with the bank, and we will let you know as soon as we have any updates. 🙌🏽",
  },
  {
    tag: "Consulta a SFP",
    q: "Para preguntarles a los SFP por una transacción",
    a: 'Could you please tell us why this payout failed?\n\nThe payout status is Failed, and the transaction status detail shows "Rejected the payout: La información es incorrecta, valida la información de los pagos - El rut no es válido" 🙌🏽\n\nID:\nTransaction ID:',
  },
  {
    tag: "Proof of payment",
    q: "Para que me den un mejor POP el merchant",
    a: "Could you provide a better proof of payment with the transfer information?",
  },
  {
    tag: "ID incorrecto",
    q: "Para preguntar si un ID es correcto",
    a: "I was not able to find the transaction with ID XXXXXXXXXXXXXXXXXXXXXXX. Could you please confirm that this is the correct transaction ID? 🙌🏽",
  },
  {
    tag: "No automática",
    q: "La transacción no fue automática porque",
    a: "It was not automatic because the CUIL data was different.\nIt was not automatic because the amount was slightly different.",
  },
];

function score(entry, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const hay = (entry.q + " " + entry.a + " " + entry.tag).toLowerCase();
  if (hay.includes(q)) return 2;
  const words = q.split(/\s+/).filter(Boolean);
  const hits = words.filter((w) => hay.includes(w)).length;
  return hits > 0 ? 1 + hits / words.length : 0;
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 11px",
  fontSize: 13.5,
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  outline: "none",
  background: "#fff",
};

const STORAGE_KEY = "respuestas-rapidas:custom-entries";

export default function App() {
  const [query, setQuery] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [customEntries, setCustomEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formTag, setFormTag] = useState("");
  const [formQ, setFormQ] = useState("");
  const [formA, setFormA] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (result && result.value) {
          setCustomEntries(JSON.parse(result.value));
        }
      } catch (e) {
        // no hay nada guardado todavia
      }
    })();
  }, []);

  const allEntries = useMemo(
    () => [...DEFAULT_ENTRIES, ...customEntries],
    [customEntries]
  );

  const results = useMemo(() => {
    return allEntries
      .map((e, i) => ({ ...e, i, s: score(e, query) }))
      .filter((e) => e.s > 0)
      .sort((a, b) => b.s - a.s);
  }, [allEntries, query]);

  function copy(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  async function persist(next) {
    setCustomEntries(next);
    try {
      const result = await window.storage.set(STORAGE_KEY, JSON.stringify(next), false);
      if (!result) throw new Error("sin resultado");
      setSaveError("");
    } catch (e) {
      setSaveError("No se pudo guardar. Probá de nuevo.");
    }
  }

  function addEntry() {
    if (!formQ.trim() || !formA.trim()) return;
    const next = [
      ...customEntries,
      { tag: formTag.trim() || "Sin categoría", q: formQ.trim(), a: formA.trim() },
    ];
    persist(next);
    setFormTag("");
    setFormQ("");
    setFormA("");
    setShowForm(false);
  }

  function removeCustomEntry(originalIndex) {
    const customIdx = originalIndex - DEFAULT_ENTRIES.length;
    if (customIdx < 0) return;
    const next = customEntries.filter((_, idx) => idx !== customIdx);
    persist(next);
  }

  return (
    <div
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 16px",
        color: "#1C1B1F",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Respuestas rápidas
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>
            Buscá por palabra clave en español y copiá la respuesta lista.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            padding: "9px 14px",
            borderRadius: 9,
            border: "none",
            background: showForm ? "#F3F4F6" : "#1C1B1F",
            color: showForm ? "#374151" : "#fff",
            cursor: "pointer",
          }}
        >
          {showForm ? (
            <>
              <X size={14} /> Cerrar
            </>
          ) : (
            <>
              <Plus size={14} /> Agregar
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 14,
            marginBottom: 18,
            background: "#FAFAFA",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <input
            value={formTag}
            onChange={(e) => setFormTag(e.target.value)}
            placeholder="Categoría (ej: Webhook)"
            style={inputStyle}
          />
          <input
            value={formQ}
            onChange={(e) => setFormQ(e.target.value)}
            placeholder="Pregunta / situación en español"
            style={inputStyle}
          />
          <textarea
            value={formA}
            onChange={(e) => setFormA(e.target.value)}
            placeholder="Respuesta lista para copiar"
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
          {saveError && (
            <div style={{ fontSize: 12, color: "#DC2626" }}>{saveError}</div>
          )}
          <button
            onClick={addEntry}
            disabled={!formQ.trim() || !formA.trim()}
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background:
                !formQ.trim() || !formA.trim() ? "#E5E7EB" : "#1C1B1F",
              color: !formQ.trim() || !formA.trim() ? "#9CA3AF" : "#fff",
              cursor: !formQ.trim() || !formA.trim() ? "not-allowed" : "pointer",
            }}
          >
            <Plus size={14} /> Guardar respuesta
          </button>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 18 }}>
        <Search
          size={17}
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9CA3AF",
          }}
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ej: joint account, webhook, iframe, POP..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px 12px 40px",
            fontSize: 15,
            borderRadius: 10,
            border: "1px solid #E5E7EB",
            outline: "none",
            background: "#FAFAFA",
          }}
        />
      </div>

      <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 10 }}>
        {results.length} resultado{results.length !== 1 ? "s" : ""}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {results.map((r) => (
          <div
            key={r.i}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: 14,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#B45309",
                    background: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    borderRadius: 999,
                    padding: "2px 8px",
                    marginBottom: 6,
                  }}
                >
                  <Tag size={10} />
                  {r.tag}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                  {r.q}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => copy(r.a, r.i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    background: copiedIdx === r.i ? "#ECFDF5" : "#F9FAFB",
                    color: copiedIdx === r.i ? "#059669" : "#374151",
                    cursor: "pointer",
                  }}
                >
                  {copiedIdx === r.i ? (
                    <>
                      <Check size={13} /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copiar
                    </>
                  )}
                </button>
                {r.i >= DEFAULT_ENTRIES.length && (
                  <button
                    onClick={() => removeCustomEntry(r.i)}
                    title="Eliminar"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border: "1px solid #FEE2E2",
                      background: "#FEF2F2",
                      color: "#DC2626",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: 13.5,
                lineHeight: 1.5,
                color: "#4B5563",
                whiteSpace: "pre-wrap",
                background: "#F9FAFB",
                borderRadius: 8,
                padding: 10,
              }}
            >
              {r.a}
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: 14,
              padding: "30px 0",
            }}
          >
            No encontré nada con esa búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}

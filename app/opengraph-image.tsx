import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0b1120,#312e81)", color: "white", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ display: "flex", fontSize: 86, fontWeight: 900, letterSpacing: -5 }}>sosyal<span style={{ color: "#a78bfa" }}>io</span></div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#cbd5e1" }}>Sosyal medya hizmetleri, açık fiyatlar ve sipariş takibi</div>
      </div>
    </div>,
    size,
  );
}

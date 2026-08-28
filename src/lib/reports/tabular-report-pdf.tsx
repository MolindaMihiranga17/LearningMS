import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 28, fontFamily: "Helvetica", fontSize: 7, color: "#172033" },
  brandBar: { height: 7, backgroundColor: "#2563eb", margin: -28, marginBottom: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "1 solid #cbd5e1" },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 1.2, color: "#2563eb", marginBottom: 5 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 19, color: "#0f172a" },
  subtitle: { marginTop: 4, color: "#64748b", fontSize: 8 },
  reportMeta: { alignItems: "flex-end", paddingTop: 2 },
  metaLabel: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: "#94a3b8", letterSpacing: 0.7, marginBottom: 3 },
  meta: { color: "#334155", fontSize: 8 },
  summaryRow: { flexDirection: "row", marginBottom: 15 },
  summaryCard: { flex: 1, backgroundColor: "#f8fafc", border: "1 solid #cbd5e1", borderRadius: 3, paddingHorizontal: 9, paddingVertical: 8, marginRight: 8 },
  summaryCardLast: { marginRight: 0 },
  summaryLabel: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: "#64748b", letterSpacing: 0.6, marginBottom: 4 },
  summaryValue: { fontFamily: "Helvetica-Bold", fontSize: 14, color: "#0f172a" },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#0f172a", marginBottom: 3 },
  sectionDescription: { fontSize: 7.5, color: "#64748b", marginBottom: 8 },
  headerRow: { flexDirection: "row", backgroundColor: "#0f172a", color: "#ffffff", paddingVertical: 6, paddingHorizontal: 3, marginBottom: 2, borderRadius: 2 },
  row: { flexDirection: "row", borderBottom: "1 solid #e2e8f0", paddingVertical: 5, paddingHorizontal: 3 },
  alternateRow: { backgroundColor: "#f8fafc" },
  cell: { flex: 1, paddingRight: 4 },
  headerCell: { fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 16, left: 28, right: 28, textAlign: "center", color: "#64748b", fontSize: 8, borderTop: "1 solid #e2e8f0", paddingTop: 6 },
});

export function TabularReportPdf({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: { key: string; header: string }[];
  rows: Record<string, unknown>[];
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.brandBar} />
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>LEARNINGMS | PLATFORM REPORTING</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>A complete, export-ready view of the selected system records.</Text>
          </View>
          <View style={styles.reportMeta}>
            <Text style={styles.metaLabel}>GENERATED</Text>
            <Text style={styles.meta}>{new Date().toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" })}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>REPORT STATUS</Text>
            <Text style={styles.meta}>Complete export</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>TOTAL RECORDS</Text><Text style={styles.summaryValue}>{rows.length}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>INCLUDED FIELDS</Text><Text style={styles.summaryValue}>{columns.length}</Text></View>
          <View style={[styles.summaryCard, styles.summaryCardLast]}><Text style={styles.summaryLabel}>FORMAT</Text><Text style={styles.summaryValue}>PDF</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Detailed records</Text>
        <Text style={styles.sectionDescription}>The following data is included in this report for review and reconciliation.</Text>

        <View style={styles.headerRow} fixed>
          {columns.map((column) => (
            <Text key={column.key} style={[styles.cell, styles.headerCell]}>{column.header}</Text>
          ))}
        </View>
        {rows.map((row, index) => (
          <View key={index} style={[styles.row, index % 2 === 1 ? styles.alternateRow : {}]} wrap={false}>
            {columns.map((column) => (
              <Text key={column.key} style={styles.cell}>{String(row[column.key] ?? "")}</Text>
            ))}
          </View>
        ))}
        <Text style={styles.footer} fixed>LearningMS | {title}</Text>
      </Page>
    </Document>
  );
}

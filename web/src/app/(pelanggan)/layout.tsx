import "../globals.css";

export default function PelangganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
export default function StatusBadge({ status }) {
  const label = (status || "").replace("_", " ");
  return <span className={`badge badge-${status}`}>{label}</span>;
}

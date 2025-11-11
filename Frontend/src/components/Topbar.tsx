import "./topbar.css";

export default function Topbar({ title }: { title?: string }) {
  return (
    <header className="tb">
      <h1 className="tb__title">{title ?? "Dashboard"}</h1>
      <div className="tb__actions">
        <input className="tb__search" placeholder="Search" />
      </div>
    </header>
  );
}

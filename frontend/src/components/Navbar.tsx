import { Link } from "react-router-dom";

export default function Navbar() {
  return <nav className="atlas-nav"><Link to="/" className="atlas-wordmark" aria-label="Atlas home"><img className="atlas-brand-logo" src="/atlas-logo-primary.png" alt="Atlas" /></Link><div className="atlas-nav-links"><a href="#platform">Platform</a><a href="#intelligence">RAG &amp; LLM</a><a href="#security">Security</a></div><div className="atlas-nav-actions"><Link to="/login">Log in</Link><Link className="atlas-button atlas-button-small" to="/signup">Talk to us <span>↗</span></Link></div></nav>;
}

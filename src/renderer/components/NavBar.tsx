import React from 'react';
// Dock & DockIcon from MagicUI were installed via shadcn earlier; using dynamic import fallback if not present.
// For now replicate minimal magnification effect with CSS until MagicUI Dock is installed.

export const NavBar: React.FC = () => {
  return (
    <nav className="nav-bar">
      <div className="nav-logo" title="Home">
        <img src={"/assets/logo.png"} alt="logo" />
      </div>
      <ul className="nav-items">
        {['+', '-'].map((item) => (
          <li key={item} className="nav-item" title={item}>
            <span>{item.charAt(0)}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavBar;

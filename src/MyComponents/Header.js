import React from "react";
import propTypes from 'prop-types';
import { Link, NavLink } from "react-router-dom";

function Header(props) {
  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">

        <Link className="navbar-brand display-5 fw-bold text-body text-uppercase" to="/">
          {props.title}
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/about">About</NavLink>
            </li>
          </ul>

          {props.searchBar && (
            <form className="d-flex me-2" role="search">
              <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
              <button className="btn btn-outline-success" type="submit">Search</button>
            </form>
          )}

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={props.toggleTheme}
          >
            {props.theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </nav>
  );
}

Header.defaultProps = {
  title: "Your Title Here",
  searchBar: false
};

Header.propTypes = {
  title: propTypes.string,
  searchBar: propTypes.bool,
  theme: propTypes.string,
  toggleTheme: propTypes.func
};

export default Header;
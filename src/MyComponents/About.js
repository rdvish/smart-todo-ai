import React from 'react';

export const About = () => {
  return (
    <div className="container my-3 text-center">
      <h1>About Us</h1>
      <div>
        <img width={200} height={100} src={process.env.PUBLIC_URL + '/vish_github_pic.jpg'} alt="About Us" className="img-fluid my-3" />
        <p>Vishweshwar</p>
      </div>
      <font>"Vishweshwar wanted to take notes on his outdated smartphone , so he built this app."</font>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import Welcome from "./welcome";
import Email from "./email";
import axios from "axios";

function App() {
  const [auth, setAuth] = useState(false);

  const check_auth = () => {
    axios.get(
      `${process.env.REACT_APP_API_URL}/api/auth/fetch_user`,
      { withCredentials: true }
    )
    .then(res => {
      if (res.data.code === 200) {
        setAuth(true);
      } else {
        setAuth(false);
      }
    })
    .catch(() => setAuth(false));
  };

  useEffect(() => {
    check_auth();
  }, []);

  return (
    <div className="container">
      {auth ? (
        <Email ask_auth={check_auth} />
      ) : (
        <Welcome ask_auth={check_auth} />
      )}
    </div>
  );
}

export default App;

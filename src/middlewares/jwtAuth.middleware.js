import jwt from "jsonwebtoken";

const jwtAuth = (req, res, next) => {
  const { jwtToken } = req.cookies;
  try {
    const payload = jwt.verify(jwtToken, "xyz");
    req.userID = payload.userID;
    req.userName = payload.userName;
  } catch (error) {
    return res.render("login", { errMessage: "Please first login to enter" });
  }
  next();
};

export default jwtAuth;

import express from "express";
import * as dotenv from "dotenv";
import { QuoteRequest } from "./model";

dotenv.config();

const app = express();
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse application/json
app.use(express.json());

//TODO add body validation
app.post("/check-price", async (req, res) => {
  console.log(req.body.toString());

  const msg: QuoteRequest = req.body;
  console.log(msg);
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`listening on port ${process.env.PORT || 8080}`);
});

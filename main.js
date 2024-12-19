import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended : true }));

app.listen(port, () => {
    console.log(port, "서버로 실행 중.");
});

// const apiKey = process.env.NVD_API_KEY;

app.get('/:cveId', async (req, res) => {
    try {
        const { cveId } = req.params;
        const cveApiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`;
        const data = await fetch(cveApiUrl);
        const jsonChange = await data.json();

        return res.status(200).json(jsonChange);
    } catch (err){
        console.log(err);
        return res.status(500).json({ message : "error" });
    }
});

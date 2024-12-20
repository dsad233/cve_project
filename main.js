import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import ExcelJS from "exceljs";
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended : true }));

app.listen(port, () => {
    console.log(port, "서버로 실행 중.");
});

// const apiKey = process.env.NVD_API_KEY;

// CVE ID로 취약점 검색
app.get('/:cveId', async (req, res) => {
    try {
        const { cveId } = req.params;
        const cveApiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`;
        const data = await fetch(cveApiUrl);
        
        if (!data) {
            return res.status(404).json({ message: 'CVE 데이터가 존재하지 않습니다.' });
        }
        
        if(data.ok){
            try {
                const jsonChange = await data.json(); 
                return res.status(200).json(jsonChange);
            } catch (err) {
                console.log(err);
                return res.status(500).json({ message: 'JSON으로 파싱 실패' });
            }
        } else {
            return res.status(data.status).json({ message: 'CVE API 요청 실패' });
        }
    } catch (err){
        console.log(err);
        return res.status(500).json({ message : "서버 에러 발생" });
    }
});

// CVE ID를 통한 엑셀 다운로드
app.get('/excel/:cveId', async (req, res) => {
    try {
        const { cveId } = req.params;
        const cveApiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`;
        const data = await fetch(cveApiUrl);
        
        if (!data) {
            return res.status(404).json({ message: 'CVE 데이터가 존재하지 않습니다.' });
        }

        const workbook = new ExcelJS.Workbook();
        
        if(data.ok){
            try {
                const jsonChange = await data.json(); 

                const worksheet = workbook.addWorksheet("CVE Data");
                worksheet.columns = [
                    { header : "취약점 아이디", key : "cve_Id", width : 20 },
                    { header : "취약점 제공사", key : "cve_source", width : 20 },
                    { header : "취약점 릴리즈", key : "cve_pushed", width : 20 },
                    { header : "취약점 최종 수정", key : "cve_lastModified", width : 20 },
                    { header : "취약점 상태", key : "cve_status", width : 20 }
                ];

                worksheet.addRows([{
                    cve_Id : jsonChange.vulnerabilities[0].cve.id,
                    cve_source : jsonChange.vulnerabilities[0].cve.sourceIdentifier,
                    cve_pushed : jsonChange.vulnerabilities[0].cve.published,
                    cve_lastModified : jsonChange.vulnerabilities[0].cve.lastModified,
                    cve_status : jsonChange.vulnerabilities[0].cve.vulnStatus,
                }]);

                const currentDate = new Date();
                const currentDayFormat =
                currentDate.getFullYear() +
                "-" +
                (currentDate.getMonth() + 1) +
                "-" +
                currentDate.getDate();

                res.header("Access-Control-Expose-Headers", "Content-Disposition");
                res.setHeader(
                  "Content-Type",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader(
                  "Content-Disposition",
                  "attachment; filename=" + currentDayFormat + "_" + "excelfile.xlsx"
                );

                // 다운로드
                await workbook.xlsx.write(res);
                res.end();

            } catch (err) {
                console.log(err);
                return res.status(500).json({ message: 'JSON으로 파싱 실패' });
            }
        } else {
            return res.status(data.status).json({ message: 'CVE API 요청 실패' });
        }
    } catch (err){
        console.log(err);
        return res.status(500).json({ message : "서버 에러 발생" });
    }
});

// 검색어로 CVE 취약점 검색
app.get('/search/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        const cveApiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${keyword}`;
        const data = await fetch(cveApiUrl);
        
        if (!data) {
            return res.status(404).json({ message: 'CVE 데이터가 존재하지 않습니다.' });
        }

        if(data.ok){
            try {
                const jsonChange = await data.json();

                const sliceData = jsonChange.vulnerabilities.slice(0, 10);
                return res.status(200).json(sliceData);
            } catch (err) {
                console.log(err);
                return res.status(500).json({ message: 'JSON으로 파싱 실패' });
            }
        } else {
            return res.status(data.status).json({ message: 'CVE API 요청 실패' });
        }
    } catch (err){
        console.log(err);
        return res.status(500).json({ message : "서버 에러 발생" });
    }
});

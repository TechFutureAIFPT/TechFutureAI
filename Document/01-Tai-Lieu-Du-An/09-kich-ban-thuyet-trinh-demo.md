# 09 - Kich ban thuyet trinh va demo

File nay dung de tap noi. Ban co the bien no thanh slide.

## Mo dau 30 giay

"Kinh thua ban giam khao, nhom em xin gioi thieu SupportHR - he thong ho tro sang loc CV bang AI. Bai toan xuat phat tu viec nha tuyen dung thuong phai doc rat nhieu CV, ton thoi gian va de cham diem khong dong nhat. SupportHR cho phep nhap JD, upload nhieu CV, sau do he thong tu dong trich xuat noi dung, cham diem, xep hang ung vien, giai thich bang chung va de xuat cau hoi phong van."

## Noi ve bai toan

Y can noi:

- Tuyen dung co nhieu CV, moi CV trinh bay khac nhau.
- HR can so sanh nhanh nhung van phai cong bang.
- Diem so phai co can cu, khong chi la cam tinh.
- AI co ich nhung phai duoc kiem soat bang pipeline va rubric.

Cau noi:

"Neu chi dua CV cho AI va hoi ung vien nao tot nhat, ket qua se kho kiem chung. Vi vay nhom em xay dung pipeline co nhieu buoc: trich text, chuan hoa JD, rut tieu chi, cham diem theo trong so, kiem tra bang chung, sau do moi xep hang."

## Noi ve giai phap

SupportHR co 3 khoi:

- Frontend React cho nguoi dung thao tac.
- Backend FastAPI xu ly AI, OCR, auth, database.
- ML pipeline train classifier nganh nghe CV.

Cau noi:

"Frontend chi la noi nguoi dung thao tac, con logic quan trong nam o backend. Backend gom cac service rieng cho OCR, Gemini, scoring, classifier, RAG, cache, Firestore va Google Drive."

## Demo flow goi y

### Buoc 1 - Mo landing page

Noi:

"Day la giao dien dau tien cua SupportHR. Nguoi dung co the xem quy trinh va bat dau sang loc CV."

Thao tac:

- Mo trang chu.
- Bam bat dau/dang nhap.

### Buoc 2 - Dang nhap

Noi:

"He thong dung Firebase Auth. Sau khi dang nhap, frontend lay ID token, backend verify token bang Firebase Admin truoc khi luu du lieu."

### Buoc 3 - Nhap JD

Noi:

"Nguoi dung dua JD goc vao he thong. Backend goi AI de chuan hoa JD, lay ten vi tri va rut cac hard filters nhu dia diem, kinh nghiem, hoc van, ngon ngu."

Thao tac:

- Paste JD.
- Cho he thong chuan hoa/rut thong tin.

### Buoc 4 - Cau hinh trong so

Noi:

"Moi cong ty co uu tien khac nhau, nen he thong cho cau hinh trong so. Mac dinh tong la 100 diem, gom phu hop JD, kinh nghiem, ky nang, thanh tuu, hoc van, ngon ngu, chuyen nghiep, gan bo va culture fit."

### Buoc 5 - Upload CV hoac import Google Drive

Noi:

"CV co the la PDF, DOCX, anh, TXT hoac CSV. Backend trich xuat text. Neu PDF scan khong co text layer, he thong dung OCR bang Gemini Vision."

Thao tac:

- Upload 1-3 CV mau.
- Neu co Drive da cau hinh, demo import Drive.

### Buoc 6 - Phan tich

Noi:

"Khi bam phan tich, frontend goi job bat dong bo. Backend tra ve job_id, sau do frontend poll trang thai. Cach nay giup he thong khong bi treo khi phan tich nhieu CV."

Noi them neu co loading:

"Trong backend, pipeline dang kiem cache, chuan hoa ngon ngu, du doan nganh nghe bang classifier, tim exemplar RAG, goi Gemini cham diem va enrich ket qua."

### Buoc 7 - Xem ket qua

Noi:

"Ket qua khong chi co diem tong. Moi ung vien co hang A/B/C, diem theo tung tieu chi, diem manh, diem yeu, bang chung trong CV va yeu cau con thieu."

Hay nhan manh:

- Ung vien nao diem cao.
- Vi sao diem cao.
- Ung vien nao thieu yeu cau.
- Diem co cong thuc/bang chung.

### Buoc 8 - Dashboard/chatbot/feedback

Noi:

"Sau khi co ket qua, nha tuyen dung co the xem dashboard chi tiet, hoi chatbot de goi y ung vien, sinh cau hoi phong van, va gui feedback de he thong cai tien."

## Doan noi ve backend

"Backend duoc xay bang FastAPI va chia thanh cac tang ro rang. Route nhan request, schema dinh nghia du lieu, service xu ly nghiep vu, repository lam viec voi Firestore, integration ket noi Firebase va Google. Pipeline chinh nam o `cv_pipeline_service.py`, co nhiem vu dieu phoi toan bo qua trinh phan tich CV."

## Doan noi ve AI

"Diem em muon nhan manh la AI trong du an khong phai mot hop den. Backend yeu cau AI tra JSON theo schema, sau do he thong con hau xu ly: chuan hoa diem, bo sung advanced breakdown, tim keyword match/missing, tao warnings va fallback bang rule-based scoring neu AI provider loi."

## Doan noi ve database

"Du lieu cua nguoi dung duoc luu tren Cloud Firestore va gan voi `uid` Firebase. Cac collection duoc tach theo nghiep vu nhu users, uploadedFiles, history, cache, templates, chatbotSessions, feedback, approvedExemplars va analysisJobs."

## Doan noi ve ML pipeline

"Ngoai Gemini, nhom em tach rieng `ml_pipeline` de train model phan loai nganh nghe CV. Model nay dung TF-IDF ket hop Logistic Regression hoac Linear SVM, xuat file `.pkl`. Backend co the load local hoac goi remote service. Classifier nay la tin hieu ho tro cho routing, RAG va industry fit."

## Ket luan 20 giay

"Tong ket lai, SupportHR giup nha tuyen dung giam thoi gian sang loc CV, cham diem ung vien theo tieu chi ro rang va giai thich duoc ket qua. He thong co frontend than thien, backend co pipeline AI day du, co database theo user, co Google Drive import, co feedback loop va co kha nang mo rong thanh san pham thuc te."

## Neu demo bi loi thi noi gi?

### Backend/AI cham

"Phan tich CV co goi AI va OCR nen co the mat vai chuc giay. He thong da thiet ke job bat dong bo va poll trang thai de tranh treo giao dien."

### Gemini/API key loi

"Backend co rule-based fallback de van tao ket qua co ban khi AI provider loi. Trong moi truong production, co the them nhieu API key va monitoring quota."

### Google Drive khong chay

"Google Drive phu thuoc redirect URI va OAuth config tren Google Cloud. Neu demo offline, he thong van ho tro upload file local va di qua cung pipeline OCR."

### Ket qua AI chua hoan hao

"Nhom em khong xem AI la nguoi ra quyet dinh cuoi cung. He thong la cong cu ho tro HR, co giai thich, co feedback va HR van la nguoi quyet dinh."

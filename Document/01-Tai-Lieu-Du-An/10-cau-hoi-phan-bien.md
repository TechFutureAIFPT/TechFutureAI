# 10 - Cau hoi phan bien va cach tra loi

## 1. He thong co thay the nha tuyen dung khong?

Khong. SupportHR la cong cu ho tro, khong phai nguoi ra quyet dinh cuoi cung. He thong giup doc CV nhanh, cham diem co cau truc va de xuat shortlist, nhung HR van xem bang chung, phong van va quyet dinh.

## 2. Vi sao can backend, sao khong goi AI truc tiep tu frontend?

Vi backend giup:

- Bao ve API key va Firebase Admin service account credentials.
- Verify token nguoi dung an toan.
- Luu history/cache/feedback theo user.
- Chay OCR, classifier, RAG va scoring phuc tap.
- Giam viec lo logic quan trong tren browser.

## 3. AI co the cham sai thi sao?

He thong giam rui ro bang nhieu cach:

- Bat AI tra ve JSON theo schema.
- Hau xu ly va chuan hoa diem.
- Tao advanced breakdown co bang chung, missing requirements.
- Co rule-based fallback.
- Co feedback loop de nguoi dung danh gia ket qua.
- HR van la nguoi duyet cuoi cung.

## 4. Lam sao giai thich diem cua ung vien?

Moi ung vien co:

- Diem tong.
- Chi tiet diem tung tieu chi.
- Cong thuc/diem toi da.
- Bang chung trong CV.
- Yeu cau thieu.
- Diem manh, diem yeu.
- Verdict/evidence quality.

Day la phan explainability, giup ket qua khong chi la mot con so.

## 5. Hard filters khac gi weights?

Hard filters la dieu kien can, vi du:

- Dia diem.
- Kinh nghiem toi thieu.
- Hoc van.
- Chung chi.
- Ngon ngu.
- Hinh thuc lam viec.

Weights la trong so cham diem theo muc do uu tien. Mot ung vien co the khong fail hoan toan hard filter nhung bi canh bao/tru diem, con weights giup xep hang chi tiet hon.

## 6. He thong co xu ly CV scan/anh khong?

Co. Backend doc PDF text layer truoc. Neu khong du text hoac user ep OCR, backend render trang PDF thanh anh va goi Gemini Vision OCR. Anh upload truc tiep cung duoc OCR.

## 7. Vi sao can classifier rieng neu da co Gemini?

Classifier rieng giup:

- Co tin hieu dinh luong nhanh ve nganh nghe.
- Giam phu thuoc hoan toan vao LLM.
- Ho tro routing metadata va RAG.
- Co the train lai bang dataset rieng.
- Chay local hoac tach thanh service remote.

Gemini van cham diem chinh, classifier la lop bo tro.

## 8. RAG trong du an dung de lam gi?

RAG dung de dua cac exemplar da duyet vao context khi cham CV moi. Neu CV moi gan voi mau da duyet, AI co tham chieu tot hon, giup diem on dinh va bam rubric hon.

## 9. Vector database da co chua?

Hien code co vector store service va co the doc vector tu JSON/Cloud Firestore. Day la vector library/vector search noi bo bang cosine similarity, chua phai vector DB chuyen dung nhu Pinecone/Qdrant/Firestore vector search. Sau nay co the thay tang luu tru bang vector DB that ma van giu logic nghiep vu.

## 10. Du lieu nguoi dung co an toan khong?

Nhung diem an toan hien co:

- Firebase Authentication dang nhap.
- Backend verify Bearer token.
- Du lieu Cloud Firestore gan theo `uid`.
- Secret nam trong env backend.
- `.env.example` khong chua key that.

Neu dua vao production lon, co the cai tien them:

- Ma hoa field nhay cam.
- Chinh sach retention/auto-delete.
- Audit log.
- Role-based access control.

## 11. Neu co nhieu CV thi co bi cham/timeout khong?

Backend co async job:

- FE gui request.
- BE tra `job_id`.
- FE poll status.
- Backend chay task nen.

Ngoai ra co cache de giam cham lai cac CV/JD da phan tich.

## 12. He thong co dung duoc khi Gemini loi khong?

Co muc fallback co ban. Neu Gemini analysis loi, backend co `build_rule_based_fallback_candidates` de tao ket qua dua tren keyword/weights. Ket qua fallback khong tot bang AI day du, nhung giup he thong khong sap hoan toan.

## 13. Cache co lam sai ket qua neu weights thay doi khong?

Backend luu hash cho JD, weights va filters. Neu cac dau vao thay doi, cache key/hash se khac, tranh dung lai ket qua cu khong phu hop.

## 14. Tai sao dung Cloud Firestore?

Cloud Firestore phu hop vi:

- De ket hop Firebase Authentication.
- Luu document JSON linh hoat.
- Phu hop history/cache/chatbot/feedback.
- Khong can setup database server rieng khi demo/deploy nhanh.

## 15. Diem A/B/C tinh the nao?

Backend gan hang theo diem tong:

- A: tu 75 tro len.
- B: tu 50 den duoi 75.
- C: duoi 50.

Day la cach xep hang nhanh de HR uu tien xem ung vien.

## 16. Lam sao tranh thien vi trong tuyen dung?

He thong co canh bao bias risk trong hard filters, vi du cac tieu chi nhay cam nhu tuoi, gioi tinh, ton giao. Tuy nhien day la buoc ho tro, khong dam bao loai bo hoan toan thien vi. Can HR va quy trinh cong ty kiem soat them.

## 17. Google Drive import khac upload local the nao?

Upload local:

- User chon file tu may.
- FE gui file len `/api/files/extract-text`.

Google Drive:

- User ket noi OAuth.
- Backend list/download/export file tu Drive.
- Backend dua file vao cung pipeline extraction.

Sau khi co text, hai luong giong nhau.

## 18. Neu CV tieng Anh thi sao?

Backend co `language_service` de detect/normalize text phuc vu analysis. Pipeline co ghi metadata ngon ngu va co the tao ban normalized tieng Viet, dong thoi giu thuat ngu ky thuat goc.

## 19. San pham nay co mo rong duoc khong?

Co. Huong mo rong:

- Them vector DB that.
- Them dashboard admin.
- Train classifier bang data noi bo doanh nghiep.
- Them ATS integration.
- Them export report PDF/Excel.
- Them role HR manager/reviewer.
- Them audit log va data retention.

## 20. Diem manh nhat cua du an la gi?

Diem manh la du an co pipeline tu dau den cuoi:

- FE thao tac day du.
- BE chia tang ro.
- OCR va Google Drive import.
- AI scoring co giai thich.
- Classifier va RAG bo tro.
- Cloud Firestore luu history/cache/feedback.
- Co test cho cac phan quan trong.

## Cau ket khi bi hoi kho

"Nhom em xac dinh SupportHR la cong cu ho tro quyet dinh, khong thay the con nguoi. Vi vay trong thiet ke, chung em uu tien giai thich duoc ket qua, luu feedback va cho HR kiem soat trong so/tieu chi, thay vi de AI tu quyet dinh hoan toan."

# 01 - Tong quan du an

## Ten va muc tieu

Ten he thong: **SupportHR**.

Muc tieu: ho tro nha tuyen dung doc, loc, cham diem va so sanh CV nhanh hon bang AI, dong thoi van giu duoc kha nang giai thich minh bach.

## Bai toan dat ra

Trong thuc te, mot dot tuyen dung co the nhan hang chuc den hang tram CV. Neu nha tuyen dung doc thu cong, ho se gap cac van de:

- Mat nhieu thoi gian doc tung CV.
- De bo sot ung vien tot neu CV trinh bay khac nhau.
- Tieu chi danh gia khong dong nhat giua cac nguoi cham.
- Kho giai thich vi sao ung vien A tot hon ung vien B.
- Kho luu lai lich su va tai su dung ket qua cho lan sau.

SupportHR giai quyet bang cach dua JD va CV vao mot pipeline co cau truc:

1. Doc file va trich text.
2. Chuan hoa JD thanh cac phan de cham diem.
3. Tu dong rut ra vi tri, yeu cau cung, nganh nghe.
4. Cham diem ung vien theo trong so.
5. Bo sung logic noi bo: keyword, location, industry, embedding, RAG, feedback.
6. Tra ve bang xep hang, diem manh, diem yeu, bang chung va cau hoi phong van.

## Doi tuong nguoi dung

Nguoi dung chinh la:

- Nha tuyen dung trong doanh nghiep.
- HR executive/HR manager.
- Truong phong can loc shortlist ung vien.
- Hoc sinh/sinh vien demo he thong AI trong cuoc thi.

## Nhung chuc nang chinh

### 1. Landing page

Gioi thieu SupportHR, quy trinh, bang so sanh va loi ich. Khi nguoi dung bat dau, he thong yeu cau dang nhap neu can.

### 2. Dang nhap

Frontend dung Supabase Auth de lang nghe trang thai dang nhap. Backend nhan `Bearer token` va verify bang Supabase JWT/JWKS.

### 3. Nhap JD

Nguoi dung co the nhap hoac upload JD. Backend co API chuan hoa JD:

- `POST /api/jd/structure`
- `POST /api/jd/position`
- `POST /api/jd/hard-filters`

### 4. Cau hinh trong so

He thong co bo trong so mac dinh cho cac nhom tieu chi:

- Phu hop JD.
- Kinh nghiem.
- Ky nang.
- Thanh tuu/KPI.
- Hoc van.
- Ngon ngu.
- Chuyen nghiep.
- Gan bo va lich su CV.
- Culture fit.

### 5. Upload/import CV

Nguoi dung co the upload file tu may hoac import tu Google Drive. Backend ho tro:

- PDF.
- DOCX.
- Anh.
- TXT.
- CSV.

### 6. Phan tich va xep hang

Backend chay pipeline `run_smart_cv_analysis` de:

- Kiem tra cache.
- Chuan hoa ngon ngu CV.
- Tao routing metadata bang classifier/TF-IDF.
- Tim RAG exemplar neu co.
- Goi Gemini cham diem.
- Enrich ket qua bang rule va embedding.
- Gan diem tong, hang A/B/C.
- Luu history neu user hop le.

### 7. Dashboard phan tich

Frontend hien thi danh sach ung vien, diem tong, chi tiet diem, diem manh, diem yeu, canh bao, insight embedding va cac thong tin loc.

### 8. Chatbot va cau hoi phong van

Sau khi co ket qua, he thong co the:

- Goi `/api/interview/questions` de sinh cau hoi.
- Dung chatbot de hoi goi y tren danh sach ung vien.
- Luu chatbot session len PostgreSQL.

### 9. Feedback loop

Nguoi dung co the gui feedback cho ket qua AI:

- Like/dislike.
- Shortlist/reject/interview/hire.
- Ghi ly do va note.

Feedback duoc luu de tao co so cai tien sau nay.

## Diem khac biet

SupportHR khong chi la mot form "upload CV roi hoi AI". He thong co kien truc day du hon:

- FE tach rieng UI, route, state va service goi API.
- BE tach route, schema, service, repository va integration.
- AI pipeline co cache, fallback, language normalization, RAG va scoring repair.
- PostgreSQL luu user profile, history, cache, uploaded files, JD templates, chatbot, feedback.
- ML pipeline doc lap giup train classifier `.pkl`.
- Hipo Tool/Android la ung dung mobile dong hanh cho thao tac nhanh va dong bo voi workflow SupportHR Web.

## Ket qua dau ra

Moi ung vien co the co:

- Ten, email, so dien thoai, file goc.
- Vi tri/nganh/phong ban/cap do kinh nghiem.
- Tong diem.
- Hang A/B/C.
- Chi tiet diem theo tieu chi.
- Bang chung trong CV.
- Yeu cau con thieu.
- Diem manh, diem yeu.
- Canh bao loc cung/loc mem.
- Cau hoi phong van.
- Metadata pipeline: cache hit, classifier, RAG, language, location.

## Cau mo ta mot cau

SupportHR la he thong AI recruitment screening co kha nang doc JD va CV, cham diem minh bach, xep hang ung vien va luu tri thuc tuyen dung theo tung nguoi dung.

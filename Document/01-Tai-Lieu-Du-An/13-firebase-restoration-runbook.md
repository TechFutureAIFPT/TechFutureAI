# 13 - Runbook khôi phục Firebase

## Nguồn dữ liệu duy nhất

- Firebase Authentication quản lý danh tính người dùng.
- Cloud Firestore lưu dữ liệu nghiệp vụ và vector exemplar.
- Backend xác minh Firebase ID token bằng Firebase Admin.
- Web dùng Firebase Web SDK; Android dùng Firebase Authentication và Firestore realtime.
- Redis chỉ dùng cho queue, cache, rate limit và trạng thái job ngắn hạn.

## Cấu hình backend

```env
FIREBASE_PROJECT_ID=gen-lang-client-0595612537
FIREBASE_SERVICE_ACCOUNT_JSON=
FIREBASE_FIRESTORE_DATABASE_ID=(default)
FIREBASE_STORAGE_BUCKET=gen-lang-client-0595612537.firebasestorage.app
```

Không đưa service-account JSON vào frontend, Android, Git hoặc log. Web và Android chỉ dùng Firebase web config public.

## Kiểm tra trước khi phát hành

1. Chạy toàn bộ pytest backend.
2. Kiểm tra `/health/ready` trả `provider=firebase` và `firestoreReady=true`.
3. Chạy `npm run typecheck`, `npm run release:env` và `npx expo-doctor` cho Android.
4. Chạy syntax/static-asset smoke test cho Web FE.
5. Deploy Firestore Rules và indexes từ `Software/firebase.json`.
6. Kiểm tra Email/Password, Google sign-in, dữ liệu tài khoản và Google Drive với tài khoản thật.
7. Đối soát số user và document trước khi xóa bất kỳ hệ thống cloud cũ nào.

## Rollback

- Giữ bản export và project cloud cũ ở chế độ không nhận traffic cho đến khi Firebase production qua smoke test.
- Nếu backend lỗi, rollback image/commit nhưng không mở ghi song song hai nguồn.
- Không xóa project cloud cũ chỉ dựa trên việc mã nguồn đã được dọn; xóa là bước quản trị riêng sau đối soát.

// Mock data cho hệ thống chống đạo văn
export interface Submission {
  id: string;
  fileName: string;
  studentCode: string;
  studentName: string;
  className: string;
  language: string;
  label: "plagiarism" | "innocent" | "suspicious";
  similarity: number;
  size: string;
  uploadedAt: string;
  status: "done" | "processing" | "pending";
}

export const mockSubmissions: Submission[] = [
  { id: "1", fileName: "064.c", studentCode: "B21DCCN064", studentName: "Nguyễn Văn A", className: "CTK46", language: "C", label: "plagiarism", similarity: 97, size: "12 KB", uploadedAt: "2026-11-04", status: "done" },
  { id: "2", fileName: "026.c", studentCode: "B21DCCN026", studentName: "Trần Thị B", className: "CTK46", language: "C", label: "plagiarism", similarity: 97, size: "11 KB", uploadedAt: "2026-11-04", status: "done" },
  { id: "3", fileName: "045.c", studentCode: "B21DCCN045", studentName: "Lê Minh C", className: "CTK46", language: "C", label: "plagiarism", similarity: 88, size: "14 KB", uploadedAt: "2026-11-04", status: "done" },
  { id: "4", fileName: "051.py", studentCode: "B21DCCN051", studentName: "Phạm Thu D", className: "CTK47", language: "Python", label: "suspicious", similarity: 82, size: "8 KB", uploadedAt: "2026-11-03", status: "done" },
  { id: "5", fileName: "040.c", studentCode: "B21DCCN040", studentName: "Hoàng Văn E", className: "CTK46", language: "C", label: "innocent", similarity: 34, size: "10 KB", uploadedAt: "2026-11-03", status: "done" },
  { id: "6", fileName: "078.cpp", studentCode: "B21DCCN078", studentName: "Võ Khánh F", className: "CTK46", language: "C++", label: "innocent", similarity: 22, size: "16 KB", uploadedAt: "2026-11-03", status: "done" },
  { id: "7", fileName: "099.java", studentCode: "B21DCCN099", studentName: "Đỗ Quang G", className: "CTK47", language: "Java", label: "suspicious", similarity: 76, size: "18 KB", uploadedAt: "2026-11-02", status: "done" },
  { id: "8", fileName: "112.py", studentCode: "B21DCCN112", studentName: "Bùi Hằng H", className: "CTK47", language: "Python", label: "innocent", similarity: 18, size: "7 KB", uploadedAt: "2026-11-02", status: "done" },
  { id: "9", fileName: "130.c", studentCode: "B21DCCN130", studentName: "Ngô Đức I", className: "CTK46", language: "C", label: "plagiarism", similarity: 91, size: "13 KB", uploadedAt: "2026-11-02", status: "done" },
  { id: "10", fileName: "205.cpp", studentCode: "B21DCCN205", studentName: "Dương Mai K", className: "CTK46", language: "C++", label: "innocent", similarity: 41, size: "15 KB", uploadedAt: "2026-11-01", status: "done" },
  { id: "11", fileName: "210.java", studentCode: "B21DCCN210", studentName: "Lý Hải L", className: "CTK47", language: "Java", label: "plagiarism", similarity: 95, size: "19 KB", uploadedAt: "2026-11-01", status: "processing" },
  { id: "12", fileName: "388.py", studentCode: "B21DCCN388", studentName: "Trịnh Oanh M", className: "CTK47", language: "Python", label: "innocent", similarity: 29, size: "9 KB", uploadedAt: "2026-11-01", status: "pending" },
];

export const sampleCodeA = `// Bài nộp sinh viên — Nguyễn Văn A
#include <stdio.h>

int main() {
    int n, i, j, temp;
    printf("Nhap n: ");
    scanf("%d", &n);
    int arr[100];
    for (i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    printf("Ket qua: ");
    for (i = 0; i < n; i++)
        printf("%d ", arr[i]);
    return 0;
}`;

export const sampleCodeB = `// Bài nộp sinh viên — Trần Thị B
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Cấu trúc dữ liệu dùng cho phần thống kê
typedef struct {
    int value;
    int count;
} Item;

static int cmp(const void *x, const void *y) {
    const Item *a = (const Item *)x;
    const Item *b = (const Item *)y;
    return a->value - b->value;
}

void thongKe(int arr[], int n) {
    Item items[100];
    int k = 0;
    int i, j;
    for (i = 0; i < n; i++) {
        int found = 0;
        for (j = 0; j < k; j++) {
            if (items[j].value == arr[i]) {
                items[j].count += 1;
                found = 1;
                break;
            }
        }
        if (!found) {
            items[k].value = arr[i];
            items[k].count = 1;
            k += 1;
        }
    }
    qsort(items, k, sizeof(Item), cmp);
    for (i = 0; i < k; i++) {
        printf("%d xuat hien %d lan\\n", items[i].value, items[i].count);
    }
}

int main() {
    int n, i, j, temp;
    printf("Nhap n: ");
    scanf("%d", &n);
    int arr[100];
    for (i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    printf("Ket qua: ");
    for (i = 0; i < n; i++)
        printf("%d ", arr[i]);
    printf("\\n");
    thongKe(arr, n);
    return 0;
}`;

export const languages = [
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
];

export const recentActivity = [
  { id: 1, text: "Bài 064.c và 026.c được đánh dấu tương đồng 97%", time: "5 phút trước", level: "high" as const },
  { id: 2, text: "Hoàn tất quét 12 bài nộp lớp CTK46", time: "1 giờ trước", level: "ok" as const },
  { id: 3, text: "Bài 051.py vượt ngưỡng cảnh báo (82%)", time: "2 giờ trước", level: "warn" as const },
  { id: 4, text: "Upload mới: Giải thuật sắp xếp — 79 bài", time: "Hôm qua", level: "ok" as const },
];

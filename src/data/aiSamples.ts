// Ba đoạn mã mẫu để thử trang phân loại AI / người viết.

export const aiSampleCode = `from dataclasses import dataclass


@dataclass
class StudentRecord:
    """Thông tin tóm tắt của một sinh viên."""

    student_id: str
    full_name: str
    score: float


def calculate_average_score(records: list[StudentRecord]) -> float:
    """Tính điểm trung bình của danh sách sinh viên.

    Bỏ qua các bản ghi có điểm âm để tránh làm sai lệch kết quả.
    """
    valid_records = [record for record in records if record.score >= 0]
    if not valid_records:
        return 0.0
    total_score = sum(record.score for record in valid_records)
    return round(total_score / len(valid_records), 2)


def find_top_students(records: list[StudentRecord], limit: int = 3) -> list[StudentRecord]:
    """Trả về các sinh viên có điểm cao nhất."""
    sorted_records = sorted(records, key=lambda record: record.score, reverse=True)
    return sorted_records[:limit]
`;

export const humanSampleCode = `#include <stdio.h>
int a[100];
int n;
void nhap(){
    int i;
    for(i=0;i<n;i++) scanf("%d",&a[i]);
}
void sapxep(){
    int i,j,t;
    for(i=0;i<n-1;i++)
    for(j=i+1;j<n;j++)
    if(a[i]>a[j]){t=a[i];a[i]=a[j];a[j]=t;}
}
int main(){
    printf("Nhap n: "); scanf("%d",&n);
    nhap();
    sapxep();
    for(int i=0;i<n;i++) printf("%d ",a[i]);
    return 0;
}
`;

export const mixedSampleCode = `from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float


# Khoảng cách Euclid giữa hai điểm
def distance(a, b):
    """Tính khoảng cách giữa hai điểm trong mặt phẳng."""
    dx = a.x - b.x
    dy = a.y - b.y
    return (dx * dx + dy * dy) ** 0.5


# Đọc danh sách điểm từ bàn phím
def read_points():
    n = int(input())
    A = []
    for i in range(n):
        x, y = map(float, input().split())
        A.append(Point(x, y))
    return A


def main():
    pts = read_points()
    s = 0
    for i in range(len(pts) - 1):
        s += distance(pts[i], pts[i + 1])
    print(round(s, 2))


main()
`;

export type SampleKind = "ai" | "human" | "mixed";

export const samples: Array<{ id: SampleKind; label: string; hint: string }> = [
  { id: "ai", label: "AI mẫu", hint: "Python có docstring, type hints, tên mô tả" },
  { id: "human", label: "Người viết", hint: "C ngắn gọn, tên biến một ký tự" },
  { id: "mixed", label: "Hỗn hợp", hint: "Nửa có cấu trúc, nửa viết tay nhanh" },
];

export const sampleInfo: Record<
  SampleKind,
  { fileName: string; title: string; description: string; accent: "amber" | "emerald" | "stone" }
> = {
  ai: {
    fileName: "student_record.py",
    title: "Code do AI sinh",
    description:
      "Docstring đầy đủ, type hints, tên biến dài và thụt lề đều. Mẫu lấy từ kho mã nguồn của hệ thống.",
    accent: "amber",
  },
  human: {
    fileName: "sap_xep.c",
    title: "Code người viết",
    description:
      "Hàm ngắn, biến i/n/a, ít chú thích và viết liền. Mẫu lấy từ kho mã nguồn của hệ thống.",
    accent: "emerald",
  },
  mixed: {
    fileName: "hinh_hoc.py",
    title: "Mã hỗn hợp",
    description:
      "Nửa đầu có cấu trúc, nửa sau viết tay nhanh. Mẫu lấy từ kho mã nguồn của hệ thống.",
    accent: "stone",
  },
};

export const sampleByKind: Record<SampleKind, string> = {
  ai: aiSampleCode,
  human: humanSampleCode,
  mixed: mixedSampleCode,
};

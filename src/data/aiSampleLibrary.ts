// Kho mã nguồn mẫu của hệ thống, chia theo 3 nhóm AI / người viết / hỗn hợp.
// Mỗi nhóm có nhiều tệp để trang chọn mẫu mở ra một danh sách thay vì một bài.

import {
  aiSampleCode,
  humanSampleCode,
  mixedSampleCode,
  type SampleKind,
} from "./aiSamples";

export interface LibrarySample {
  id: string;
  kind: SampleKind;
  fileName: string;
  title: string;
  description: string;
  author: string;
  className: string;
  uploadedAt: string;
  code: string;
}

const extraAi = {
  gpa: `from dataclasses import dataclass


@dataclass
class CourseResult:
    """Kết quả của một môn học."""

    course_name: str
    credits: int
    score: float


def calculate_weighted_gpa(results: list[CourseResult]) -> float:
    """Tính điểm trung bình có trọng số theo số tín chỉ."""
    total_credits = sum(result.credits for result in results)
    if total_credits == 0:
        return 0.0
    weighted_sum = sum(result.score * result.credits for result in results)
    return round(weighted_sum / total_credits, 2)


def classify_results(results: list[CourseResult]) -> dict[str, int]:
    """Đếm số môn theo mức xếp loại."""
    summary = {"excellent": 0, "good": 0, "average": 0}
    for result in results:
        if result.score >= 8.5:
            summary["excellent"] += 1
        elif result.score >= 7.0:
            summary["good"] += 1
        else:
            summary["average"] += 1
    return summary
`,
  triangle: `import math


def calculate_triangle_area(a: float, b: float, c: float) -> float:
    """Tính diện tích tam giác theo công thức Heron."""
    if a <= 0 or b <= 0 or c <= 0:
        raise ValueError("Độ dài cạnh phải là số dương")
    if a + b <= c or b + c <= a or c + a <= b:
        raise ValueError("Ba cạnh không tạo thành tam giác")
    semi_perimeter = (a + b + c) / 2
    area = math.sqrt(
        semi_perimeter
        * (semi_perimeter - a)
        * (semi_perimeter - b)
        * (semi_perimeter - c)
    )
    return round(area, 2)


def classify_triangle(a: float, b: float, c: float) -> str:
    """Phân loại tam giác theo độ dài ba cạnh."""
    sides = sorted([a, b, c])
    if sides[0] == sides[1] == sides[2]:
        return "equilateral"
    if sides[0] == sides[1] or sides[1] == sides[2]:
        return "isosceles"
    return "scalene"
`,
  order: `from dataclasses import dataclass


@dataclass
class OrderItem:
    """Một mặt hàng trong đơn hàng."""

    product_name: str
    unit_price: float
    quantity: int


def calculate_order_total(items: list[OrderItem]) -> float:
    """Tính tổng tiền của đơn hàng."""
    total_amount = 0.0
    for item in items:
        total_amount += item.unit_price * item.quantity
    return round(total_amount, 2)


def filter_expensive_items(
    items: list[OrderItem],
    threshold: float,
) -> list[OrderItem]:
    """Lọc các mặt hàng có giá trị vượt ngưỡng."""
    return [
        item
        for item in items
        if item.unit_price * item.quantity >= threshold
    ]
`,
};

const extraHuman = {
  search: `#include <stdio.h>
int a[1000];
int n,x;
void nhap(){
    int i;
    scanf("%d",&n);
    for(i=0;i<n;i++) scanf("%d",&a[i]);
    scanf("%d",&x);
}
int tim(){
    int i;
    for(i=0;i<n;i++)
        if(a[i]==x) return i;
    return -1;
}
int main(){
    nhap();
    int k=tim();
    if(k==-1) printf("khong thay");
    else printf("%d",k);
    return 0;
}
`,
  matrix: `#include <stdio.h>
int a[50][50],b[50][50],c[50][50];
int m,n,p;
void nhap(){
    int i,j;
    scanf("%d%d%d",&m,&n,&p);
    for(i=0;i<m;i++)
    for(j=0;j<n;j++) scanf("%d",&a[i][j]);
    for(i=0;i<n;i++)
    for(j=0;j<p;j++) scanf("%d",&b[i][j]);
}
void nhan(){
    int i,j,k;
    for(i=0;i<m;i++)
    for(j=0;j<p;j++){
        c[i][j]=0;
        for(k=0;k<n;k++) c[i][j]+=a[i][k]*b[k][j];
    }
}
int main(){
    nhap();
    nhan();
    int i,j;
    for(i=0;i<m;i++){
        for(j=0;j<p;j++) printf("%d ",c[i][j]);
        printf("\\n");
    }
    return 0;
}
`,
  prime: `#include <stdio.h>
#include <math.h>
int n;
int kt(int x){
    int i;
    if(x<2) return 0;
    for(i=2;i<=sqrt(x);i++)
        if(x%i==0) return 0;
    return 1;
}
int main(){
    int i,dem=0;
    scanf("%d",&n);
    for(i=2;i<=n;i++)
        if(kt(i)){
            printf("%d ",i);
            dem++;
        }
    printf("\\n%d",dem);
    return 0;
}
`,
};

const extraMixed = {
  students: `from dataclasses import dataclass


@dataclass
class Student:
    student_id: str
    full_name: str
    score: float


def find_best_student(students: list[Student]) -> Student:
    best = students[0]
    for student in students:
        if student.score > best.score:
            best = student
    return best


# đọc dữ liệu từ bàn phím
def nhap():
    n = int(input())
    ds = []
    for i in range(n):
        ma = input()
        ten = input()
        d = float(input())
        ds.append(Student(ma, ten, d))
    return ds


ds = nhap()
best = find_best_student(ds)
print(best.full_name, best.score)
`,
  array: `# Tính trung bình và đếm số chẵn trong mảng
def average(numbers):
    if not numbers:
        return 0.0
    total = 0
    for value in numbers:
        total += value
    return total / len(numbers)


def count_even(numbers):
    count = 0
    for value in numbers:
        if value % 2 == 0:
            count += 1
    return count


n = int(input())
a = []
i = 0
while i < n:
    a.append(int(input()))
    i += 1
TB = average(a)
dem = count_even(a)
print(TB, dem)
`,
  books: `class Sach:
    def __init__(self, ma: str, ten: str, gia: float) -> None:
        self.ma = ma
        self.ten = ten
        self.gia = gia

    def hien_thi(self) -> None:
        print(self.ma, self.ten, self.gia)


# nhập danh sách sách
n = int(input())
ds = []
for i in range(n):
    ma = input()
    ten = input()
    gia = float(input())
    ds.append(Sach(ma, ten, gia))

# sắp xếp theo giá giảm dần
for i in range(len(ds)-1):
    for j in range(i+1, len(ds)):
        if ds[i].gia < ds[j].gia:
            tmp = ds[i]
            ds[i] = ds[j]
            ds[j] = tmp

for s in ds:
    s.hien_thi()
`,
};

export const sampleLibrary: LibrarySample[] = [
  // AI ---------------------------------------------------------------------
  {
    id: "ai-01",
    kind: "ai",
    fileName: "student_record.py",
    title: "Quản lý hồ sơ sinh viên",
    description: "Docstring, type hints và tên biến mô tả ở toàn bộ tệp.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK46",
    uploadedAt: "2026-11-02",
    code: aiSampleCode,
  },
  {
    id: "ai-02",
    kind: "ai",
    fileName: "quan_ly_diem.py",
    title: "Tính điểm trung bình có trọng số",
    description: "Tách hàm rõ ràng, chú thích từng bước, xử lý trường hợp rỗng.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK46",
    uploadedAt: "2026-11-02",
    code: extraAi.gpa,
  },
  {
    id: "ai-03",
    kind: "ai",
    fileName: "hinh_tam_giac.py",
    title: "Diện tích và phân loại tam giác",
    description: "Kiểm tra dữ liệu đầu vào, đặt tên biến dài, có mô tả hàm.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK47",
    uploadedAt: "2026-11-03",
    code: extraAi.triangle,
  },
  {
    id: "ai-04",
    kind: "ai",
    fileName: "xu_ly_don_hang.py",
    title: "Tính tiền và lọc đơn hàng",
    description: "Dùng dataclass, hàm nhỏ một nhiệm vụ, định dạng thống nhất.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK47",
    uploadedAt: "2026-11-03",
    code: extraAi.order,
  },

  // Người viết ---------------------------------------------------------------
  {
    id: "human-01",
    kind: "human",
    fileName: "sap_xep.c",
    title: "Sắp xếp mảng tăng dần",
    description: "Hàm ngắn, biến i/n/a, gần như không có chú thích.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK46",
    uploadedAt: "2026-11-01",
    code: humanSampleCode,
  },
  {
    id: "human-02",
    kind: "human",
    fileName: "tim_kiem.c",
    title: "Tìm kiếm tuyến tính",
    description: "Viết liền, tên biến một ký tự, không tách hàm phụ.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK46",
    uploadedAt: "2026-11-01",
    code: extraHuman.search,
  },
  {
    id: "human-03",
    kind: "human",
    fileName: "ma_tran.c",
    title: "Nhân hai ma trận",
    description: "Ba vòng lặp i/j/k, mảng toàn cục, định dạng tối giản.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK48",
    uploadedAt: "2026-11-04",
    code: extraHuman.matrix,
  },
  {
    id: "human-04",
    kind: "human",
    fileName: "nguyen_to.c",
    title: "Liệt kê số nguyên tố",
    description: "Hàm kiểm tra ngắn, biến đếm đơn giản, ít khoảng trắng.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK48",
    uploadedAt: "2026-11-04",
    code: extraHuman.prime,
  },

  // Hỗn hợp ----------------------------------------------------------------
  {
    id: "mixed-01",
    kind: "mixed",
    fileName: "hinh_hoc.py",
    title: "Khoảng cách giữa các điểm",
    description: "Nửa đầu có cấu trúc, nửa sau viết tay nhanh.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK46",
    uploadedAt: "2026-11-02",
    code: mixedSampleCode,
  },
  {
    id: "mixed-02",
    kind: "mixed",
    fileName: "quan_ly_sv.py",
    title: "Tìm sinh viên điểm cao nhất",
    description: "Dataclass và docstring ở trên, phần nhập liệu viết vội ở dưới.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK47",
    uploadedAt: "2026-11-03",
    code: extraMixed.students,
  },
  {
    id: "mixed-03",
    kind: "mixed",
    fileName: "phan_tich_mang.py",
    title: "Trung bình và đếm số chẵn",
    description: "Hai hàm gọn nhưng phần chạy chính dùng biến ngắn, thiếu tổ chức.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK48",
    uploadedAt: "2026-11-04",
    code: extraMixed.array,
  },
  {
    id: "mixed-04",
    kind: "mixed",
    fileName: "quan_ly_sach.py",
    title: "Sắp xếp danh sách sách",
    description: "Có lớp và chú thích, nhưng thuật toán viết tay và tên biến ngắn.",
    author: "Kho mã nguồn hệ thống",
    className: "CTK48",
    uploadedAt: "2026-11-05",
    code: extraMixed.books,
  },
];

export const sampleById = new Map(sampleLibrary.map((sample) => [sample.id, sample]));

export const samplesOfKind = (kind: SampleKind) =>
  sampleLibrary.filter((sample) => sample.kind === kind);

export const findLibrarySample = (id: string | null) =>
  id ? sampleById.get(id) ?? null : null;

export const kindLibraryCount: Record<SampleKind, number> = {
  ai: samplesOfKind("ai").length,
  human: samplesOfKind("human").length,
  mixed: samplesOfKind("mixed").length,
};

# Admin Categories Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full admin category management screen with list, search, create, edit, delete, plus backend CRUD routes, while leaving unrelated pages untouched.

**Architecture:** Reuse the existing `categories` backend module for both public read access and admin CRUD endpoints. Add a dedicated frontend admin hook for data flow and a separate UI page that matches the existing admin dashboard/course moderation visual language and layout.

**Tech Stack:** NestJS, TypeORM, class-validator, React, React Router, Axios, TailwindCSS, lucide-react, react-hot-toast

---

### Task 1: Backend category CRUD

**Files:**
- Modify: `backend/src/modules/categories/categories.controller.ts`
- Modify: `backend/src/modules/categories/categories.service.ts`
- Modify: `backend/src/modules/categories/categories.module.ts`

- [ ] **Step 1: Add the admin category service methods**

```ts
async findAll(query?: { search?: string; admin?: boolean }) {
  const qb = this.categoryRepo.createQueryBuilder('category');

  if (query?.search?.trim()) {
    qb.andWhere('LOWER(category.tenDM) LIKE LOWER(:search)', {
      search: `%${query.search.trim()}%`,
    });
  }

  qb.orderBy('category.tenDM', 'ASC');

  if (query?.admin) {
    return qb.getMany();
  }

  return qb.select(['category.maDM', 'category.tenDM']).getMany();
}

async create(payload: { TenDM: string; MoTa?: string }) {
  const category = this.categoryRepo.create(payload);
  return this.categoryRepo.save(category);
}

async update(id: number, payload: { TenDM?: string; MoTa?: string }) {
  await this.categoryRepo.update({ maDM: id }, payload);
  return this.categoryRepo.findOne({ where: { maDM: id } });
}

async remove(id: number) {
  await this.categoryRepo.delete({ maDM: id });
}
```

- [ ] **Step 2: Add admin routes to the controller**

```ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseIntPipe } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Get()
async getAllCategories(@Query('search') search?: string) {
  return this.categoriesService.findAll({ search });
}

@Get('/admin')
async getAdminCategories(@Query('search') search?: string) {
  return this.categoriesService.findAll({ search, admin: true });
}

@Post('/admin')
async createCategory(@Body() body: CreateCategoryDto) {
  return this.categoriesService.create(body);
}

@Patch('/admin/:id')
async updateCategory(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: UpdateCategoryDto,
) {
  return this.categoriesService.update(id, body);
}

@Delete('/admin/:id')
async deleteCategory(@Param('id', ParseIntPipe) id: number) {
  await this.categoriesService.remove(id);
  return { success: true };
}
```

- [ ] **Step 3: Export the service from the module exactly as before**

```ts
imports: [TypeOrmModule.forFeature([Category])],
controllers: [CategoriesController],
providers: [CategoriesService],
exports: [TypeOrmModule],
```

- [ ] **Step 4: Verify backend routes compile with the existing TypeORM entity**

Run: `cd backend && npm run build`
Expected: build succeeds with the new controller/service signatures.

### Task 2: Frontend admin categories hook

**Files:**
- Create: `frontend/src/pages/admin/Categories/hooks/useAdminCategories.ts`

- [ ] **Step 1: Define a focused categories hook**

```ts
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axiosClient from '../../../../api/axios';

export interface AdminCategoryItem {
  maDM: number;
  tenDM: string;
  moTa?: string | null;
}

export function useAdminCategories() {
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get<AdminCategoryItem[]>('/admin/categories', {
        params: { search: search.trim() || undefined },
      } as any);
      setCategories(Array.isArray(response) ? response : []);
    } catch {
      toast.error('Không thể tải danh mục.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, [search]);

  const createCategory = async (payload: { TenDM: string; MoTa?: string }) => {
    const created = await axiosClient.post<AdminCategoryItem>('/admin/categories', payload);
    setCategories((current) => [...current, created].sort((a, b) => a.tenDM.localeCompare(b.tenDM, 'vi')));
    toast.success('Đã thêm danh mục.');
  };

  const updateCategory = async (id: number, payload: { TenDM?: string; MoTa?: string }) => {
    const updated = await axiosClient.patch<AdminCategoryItem>(`/admin/categories/${id}`, payload);
    setCategories((current) => current.map((item) => (item.maDM === id ? updated : item)));
    toast.success('Đã cập nhật danh mục.');
  };

  const deleteCategory = async (id: number) => {
    await axiosClient.delete(`/admin/categories/${id}`);
    setCategories((current) => current.filter((item) => item.maDM !== id));
    toast.success('Đã xóa danh mục.');
  };

  return { categories, loading, search, setSearch, reloadCategories: loadCategories, createCategory, updateCategory, deleteCategory };
}
```

- [ ] **Step 2: Verify the hook is isolated and no other page imports it**

Run: `rg -n "useAdminCategories" frontend/src`
Expected: only the new admin categories page imports it.

### Task 3: Frontend admin categories UI

**Files:**
- Create: `frontend/src/pages/admin/Categories/AdminCategories.tsx`

- [ ] **Step 1: Implement the page using the existing admin layout style**

```tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Layers3, Loader2 } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminCategories } from './hooks/useAdminCategories';

export default function AdminCategories() {
  const navigate = useNavigate();
  const { categories, loading, search, setSearch, createCategory, updateCategory, deleteCategory } = useAdminCategories();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ TenDM: '', MoTa: '' });
  const filteredCount = useMemo(() => categories.length, [categories]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        ...
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Add the full list/search/form/modal UI**

Use the same visual language as admin courses and posts:
`rounded-[24px]` panels, slate borders, emerald accent, dense table rows, and a modal for delete confirmation.

- [ ] **Step 3: Wire inline add/edit form state to the hook methods**

Create mode posts to `/admin/categories`; edit mode patches `/admin/categories/:id`.

- [ ] **Step 4: Add empty, loading, and delete confirmation states**

Loading uses skeleton rows; empty state explains there are no categories or the search returned nothing.

### Task 4: Admin routes

**Files:**
- Modify: `frontend/src/routes/AdminRoutes.tsx`

- [ ] **Step 1: Register the new route**

```tsx
import AdminCategories from '../pages/admin/Categories/AdminCategories';

<Route path="categories" element={<AdminCategories />} />
```

- [ ] **Step 2: Verify sidebar link already points to the same path**

Run: `rg -n "/admin/categories" frontend/src/components/common/AdminSidebar.tsx frontend/src/routes/AdminRoutes.tsx`
Expected: sidebar and route both use `/admin/categories`.

### Task 5: Verification

**Files:**
- None

- [ ] **Step 1: Run frontend checks**

Run: `cd frontend && npm run lint`
Run: `cd frontend && npm run build`

- [ ] **Step 2: Run backend build**

Run: `cd backend && npm run build`

- [ ] **Step 3: Manually inspect that unrelated pages were not changed**

Run: `git diff -- frontend/src/pages/admin/Dashboard frontend/src/pages/admin/Courses frontend/src/pages/admin/Posts`
Expected: only intended category/admin routing files changed.

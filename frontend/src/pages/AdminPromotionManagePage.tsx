import { useState } from 'react';
import { usePromotions } from '../hooks/usePromotions';
import { useAdminStats } from '../hooks/useAdminStats';
import { useAdminPromotions, useApplicants } from '../hooks/useAdminPromotions';
import { MBTI_TYPE_CODES } from '../constants/mbtiTypes';
import { ApiError } from '../api/authApi';
import type { PromotionOfferListItem } from '../types/domain';

interface FormState {
  name: string;
  description: string;
  ends_at: string;
  mbti_type_codes: string[];
}

const EMPTY_FORM: FormState = { name: '', description: '', ends_at: '', mbti_type_codes: [] };

function ApplicantsCell({ promotionOfferId, count }: { promotionOfferId: string; count: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: applicants, isLoading } = useApplicants(promotionOfferId, isOpen);

  return (
    <details onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
      <summary>{count}명</summary>
      {isOpen && isLoading && <p>불러오는 중...</p>}
      {isOpen && applicants && applicants.length === 0 && <p>신청자가 없습니다.</p>}
      {isOpen && applicants && applicants.length > 0 && (
        <ul className="applicant-list">
          {applicants.map((a) => (
            <li key={a.email}>
              {a.email} ({new Date(a.applied_at).toLocaleDateString()})
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

export default function AdminPromotionManagePage() {
  const { data: promotions, isLoading, isError } = usePromotions();
  const { data: stats } = useAdminStats();
  const { create, update, remove } = useAdminPromotions();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const statsById = new Map((stats?.by_promotion ?? []).map((s) => [s.id, s]));

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsCreating(true);
    setEditingId(null);
  }

  function openEdit(promotion: PromotionOfferListItem) {
    setForm({
      name: promotion.name,
      description: promotion.description,
      ends_at: promotion.ends_at ? promotion.ends_at.slice(0, 10) : '',
      mbti_type_codes: promotion.mbti_type_codes,
    });
    setFormError(null);
    setEditingId(promotion.id);
    setIsCreating(false);
  }

  function closeForm() {
    setIsCreating(false);
    setEditingId(null);
    setFormError(null);
  }

  function toggleType(code: string) {
    setForm((prev) => ({
      ...prev,
      mbti_type_codes: prev.mbti_type_codes.includes(code)
        ? prev.mbti_type_codes.filter((c) => c !== code)
        : [...prev.mbti_type_codes, code],
    }));
  }

  function handleSave() {
    if (form.mbti_type_codes.length === 0) {
      setFormError('대상 MBTI 유형을 1개 이상 선택해야 합니다.');
      return;
    }
    const input = {
      name: form.name,
      description: form.description,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      mbti_type_codes: form.mbti_type_codes,
    };
    const onSuccess = () => closeForm();
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.message : '저장에 실패했습니다.');

    if (editingId) {
      update.mutate({ id: editingId, input }, { onSuccess, onError });
    } else {
      create.mutate(input, { onSuccess, onError });
    }
  }

  function handleDelete(id: string) {
    if (!window.confirm('삭제하시겠습니까?')) return;
    remove.mutate(id);
  }

  if (isLoading) return <div className="admin-promotion-page">불러오는 중...</div>;
  if (isError || !promotions) {
    return <div className="admin-promotion-page auth-error">프로모션을 불러오지 못했습니다.</div>;
  }

  const isFormOpen = isCreating || editingId !== null;

  return (
    <div className="admin-promotion-page">
      <div className="admin-promotion-page__header">
        <h1 className="auth-title">프로모션 관리</h1>
        <button type="button" className="submit-button" onClick={openCreate}>
          + 신규 등록
        </button>
      </div>

      <table className="admin-promotion-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>마감일</th>
            <th>대상 유형</th>
            <th>매칭수</th>
            <th>북마크</th>
            <th>신청</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((promotion) => {
            const stat = statsById.get(promotion.id);
            return (
              <tr key={promotion.id}>
                <td>{promotion.name}</td>
                <td>{promotion.ends_at ? new Date(promotion.ends_at).toLocaleDateString() : '상시'}</td>
                <td>{promotion.mbti_type_codes.join(', ')}</td>
                <td>{stat?.recommended_match_count ?? 0}</td>
                <td>{stat?.bookmark_count ?? promotion.bookmark_count}</td>
                <td>
                  <ApplicantsCell promotionOfferId={promotion.id} count={promotion.application_count} />
                </td>
                <td>
                  <button type="button" onClick={() => openEdit(promotion)}>
                    수정
                  </button>
                  <button type="button" className="auth-error" onClick={() => handleDelete(promotion.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isFormOpen && (
        <div className="card admin-promotion-form">
          <label className="auth-field">
            프로모션 이름
            <input
              className="auth-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="auth-field">
            설명
            <textarea
              className="auth-input"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="auth-field">
            마감일(선택)
            <input
              type="date"
              className="auth-input"
              value={form.ends_at}
              onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
            />
          </label>
          <div className="auth-field">
            대상 MBTI 유형 (1개 이상 선택)
            <div className="mbti-type-checkboxes">
              {MBTI_TYPE_CODES.map((code) => (
                <label key={code}>
                  <input
                    type="checkbox"
                    checked={form.mbti_type_codes.includes(code)}
                    onChange={() => toggleType(code)}
                  />
                  {code}
                </label>
              ))}
            </div>
          </div>
          {formError && <p className="auth-error">{formError}</p>}
          <div className="admin-promotion-form__actions">
            <button type="button" onClick={closeForm}>
              취소
            </button>
            <button type="button" className="auth-button" onClick={handleSave}>
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

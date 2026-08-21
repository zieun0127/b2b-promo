export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface MbtiQuestion {
  id: string;
  content: string;
  target_indicator: 'EI' | 'SN' | 'TF' | 'JP';
  yes_trait_value: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
}

export interface PromotionOffer {
  id: string;
  name: string;
  description: string;
}

export interface MbtiResultType {
  type_code: string;
  description: string;
  business_tip: string;
}

export interface IndicatorTraitStat {
  value: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
  count: number;
  ratio: number;
}

export interface IndicatorStat {
  indicator: 'EI' | 'SN' | 'TF' | 'JP';
  traits: IndicatorTraitStat[];
}

export interface ResultTypeStat {
  type_code: string;
  count: number;
  ratio: number;
}

export interface PromotionStat {
  id: string;
  name: string;
  recommended_match_count: number;
  bookmark_count: number;
}

export interface AdminStats {
  total_completed_submissions: number;
  by_result_type: ResultTypeStat[];
  by_indicator: IndicatorStat[];
  by_promotion: PromotionStat[];
}

export interface PromotionOfferListItem extends PromotionOffer {
  created_at: string;
  ends_at: string | null;
  mbti_type_codes: string[];
  recommended: boolean;
  bookmark_count: number;
  is_bookmarked: boolean;
  application_count: number;
  is_applied: boolean;
}

export interface PromotionOfferInput {
  name: string;
  description: string;
  ends_at: string | null;
  mbti_type_codes: string[];
}

export interface Bookmark {
  promotion_offer_id: string;
  created_at: string;
}

export interface Application {
  promotion_offer_id: string;
  applied_at: string;
}

export interface Applicant {
  email: string;
  applied_at: string;
}

export interface TestSubmissionResult {
  id: string;
  user_id: string;
  submitted_at: string;
  ei_value: 'E' | 'I';
  sn_value: 'S' | 'N';
  tf_value: 'T' | 'F';
  jp_value: 'J' | 'P';
  status: 'COMPLETED';
  mbti_result_type: MbtiResultType;
  promotion_offers: PromotionOffer[];
}

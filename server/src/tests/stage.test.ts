import { canTransition, isTerminalStage } from '../services/common';
import { CandidateStage } from '@prisma/client';

describe('Stage Transition Rules', () => {
  describe('canTransition', () => {
    it('should allow SCREENING -> HR_INTERVIEW', () => {
      expect(canTransition(CandidateStage.SCREENING, CandidateStage.HR_INTERVIEW)).toBe(true);
    });

    it('should allow SCREENING -> REJECTED', () => {
      expect(canTransition(CandidateStage.SCREENING, CandidateStage.REJECTED)).toBe(true);
    });

    it('should not allow SCREENING -> TECH_INTERVIEW', () => {
      expect(canTransition(CandidateStage.SCREENING, CandidateStage.TECH_INTERVIEW)).toBe(false);
    });

    it('should allow HR_INTERVIEW -> TECH_INTERVIEW', () => {
      expect(canTransition(CandidateStage.HR_INTERVIEW, CandidateStage.TECH_INTERVIEW)).toBe(true);
    });

    it('should allow HR_INTERVIEW -> REJECTED', () => {
      expect(canTransition(CandidateStage.HR_INTERVIEW, CandidateStage.REJECTED)).toBe(true);
    });

    it('should allow TECH_INTERVIEW -> FINAL_INTERVIEW', () => {
      expect(canTransition(CandidateStage.TECH_INTERVIEW, CandidateStage.FINAL_INTERVIEW)).toBe(true);
    });

    it('should allow FINAL_INTERVIEW -> OFFER', () => {
      expect(canTransition(CandidateStage.FINAL_INTERVIEW, CandidateStage.OFFER)).toBe(true);
    });

    it('should allow OFFER -> HIRED', () => {
      expect(canTransition(CandidateStage.OFFER, CandidateStage.HIRED)).toBe(true);
    });

    it('should allow OFFER -> REJECTED', () => {
      expect(canTransition(CandidateStage.OFFER, CandidateStage.REJECTED)).toBe(true);
    });

    it('should not allow HIRED -> any stage', () => {
      expect(canTransition(CandidateStage.HIRED, CandidateStage.OFFER)).toBe(false);
      expect(canTransition(CandidateStage.HIRED, CandidateStage.HIRED)).toBe(false);
    });

    it('should not allow REJECTED -> any stage', () => {
      expect(canTransition(CandidateStage.REJECTED, CandidateStage.SCREENING)).toBe(false);
      expect(canTransition(CandidateStage.REJECTED, CandidateStage.HIRED)).toBe(false);
    });
  });

  describe('isTerminalStage', () => {
    it('should return true for HIRED', () => {
      expect(isTerminalStage(CandidateStage.HIRED)).toBe(true);
    });

    it('should return true for REJECTED', () => {
      expect(isTerminalStage(CandidateStage.REJECTED)).toBe(true);
    });

    it('should return false for SCREENING', () => {
      expect(isTerminalStage(CandidateStage.SCREENING)).toBe(false);
    });

    it('should return false for OFFER', () => {
      expect(isTerminalStage(CandidateStage.OFFER)).toBe(false);
    });
  });
});

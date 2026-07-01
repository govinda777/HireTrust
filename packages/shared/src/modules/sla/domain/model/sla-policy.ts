import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { SlaMetricCapturedEvent, SlaValidatedEvent, SlaViolatedEvent } from '../events/sla-events';

export interface SlaThresholds {
  minUptime: number; // percentage
  maxResponseTime: number; // ms
  minSuccessRate: number; // percentage
}

export class SlaPolicy extends AggregateRoot {
  private _agreementId: string;
  private _thresholds: SlaThresholds;
  private _currentMetrics: Map<string, number[]> = new Map();

  constructor(id: string, agreementId: string, thresholds: SlaThresholds) {
    super(id);
    this._agreementId = agreementId;
    this._thresholds = thresholds;
  }

  public captureMetric(cycleId: string, type: 'UPTIME' | 'RESPONSE_TIME' | 'SUCCESS_RATE', value: number): void {
    const key = `${cycleId}_${type}`;
    if (!this._currentMetrics.has(key)) {
      this._currentMetrics.set(key, []);
    }
    this._currentMetrics.get(key)!.push(value);

    this.apply(new SlaMetricCapturedEvent(this.id, cycleId, type, value, new Date()));
  }

  public validateCycle(cycleId: string): void {
    const metrics = this.consolidateMetrics(cycleId);
    const violations: string[] = [];

    if (metrics.uptime < this._thresholds.minUptime) {
      violations.push(`Uptime ${metrics.uptime}% is below ${this._thresholds.minUptime}%`);
    }
    if (metrics.responseTime > this._thresholds.maxResponseTime) {
      violations.push(`Response time ${metrics.responseTime}ms is above ${this._thresholds.maxResponseTime}ms`);
    }
    if (metrics.successRate < this._thresholds.minSuccessRate) {
      violations.push(`Success rate ${metrics.successRate}% is below ${this._thresholds.minSuccessRate}%`);
    }

    if (violations.length > 0) {
      this.apply(new SlaViolatedEvent(this.id, cycleId, violations.join(', '), metrics));
    } else {
      // Generate a dummy proof hash for automation demonstration
      const proofHash = `proof_${cycleId}_${Date.now()}`;
      this.apply(new SlaValidatedEvent(this.id, cycleId, proofHash, metrics));
    }
  }

  private consolidateMetrics(cycleId: string) {
    const uptimeArr = this._currentMetrics.get(`${cycleId}_UPTIME`) || [100];
    const responseTimeArr = this._currentMetrics.get(`${cycleId}_RESPONSE_TIME`) || [0];
    const successRateArr = this._currentMetrics.get(`${cycleId}_SUCCESS_RATE`) || [100];

    return {
      uptime: uptimeArr.reduce((a, b) => a + b, 0) / uptimeArr.length,
      responseTime: responseTimeArr.reduce((a, b) => a + b, 0) / responseTimeArr.length,
      successRate: successRateArr.reduce((a, b) => a + b, 0) / successRateArr.length,
    };
  }

  public get agreementId(): string {
    return this._agreementId;
  }
}

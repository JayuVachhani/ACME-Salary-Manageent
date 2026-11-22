import { Injectable } from '@nestjs/common';
/** Shared pending OTP work; drained after HTTP shutdown by ApplicationLifecycle. */
@Injectable()
export class OtpDeliveries {
  private readonly pending = new Set<Promise<void>>();
  track(delivery: Promise<void>) {
    this.pending.add(delivery);
    void delivery.then(() => this.pending.delete(delivery), () => this.pending.delete(delivery));
  }
  async drain() { await Promise.allSettled([...this.pending]); }
}

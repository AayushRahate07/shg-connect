/**
 * Single-Writer Master Lease Service (Phase 8 Rural Hardening)
 * 
 * Prevents the "Offline Phantom Corpus Double-Spend":
 * In rural SHGs, physical cash cannot be rolled back by software OCC.
 * Only the designated Primary Master Device is authorized to disburse cash or sanction loans while disconnected.
 * Secondary devices are strictly restricted to read-only passbooks or non-cash draft proposals.
 */

const LEASE_STORAGE_KEY = 'shg_master_device_lease_v1';

export interface DeviceLeaseState {
  shgId: string;
  isMasterDevice: boolean;
  masterDeviceName: string;
  assignedOfficerRole: 'SECRETARY' | 'TREASURER' | 'PRESIDENT';
  grantedAt: string;
}

class MasterLeaseService {
  private state: DeviceLeaseState;

  constructor() {
    this.state = this.loadLeaseState();
  }

  private loadLeaseState(): DeviceLeaseState {
    try {
      const stored = localStorage.getItem(LEASE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not load master lease state:", e);
    }

    // Default: Initial device is Primary Master Device (Secretary's Phone)
    const defaultState: DeviceLeaseState = {
      shgId: 'SHG-MH-SAT-2024-0089',
      isMasterDevice: true,
      masterDeviceName: 'अनिताताईंचा फोन (Secretary Primary Device)',
      assignedOfficerRole: 'SECRETARY',
      grantedAt: new Date().toISOString()
    };
    this.saveLeaseState(defaultState);
    return defaultState;
  }

  private saveLeaseState(state: DeviceLeaseState) {
    this.state = state;
    try {
      localStorage.setItem(LEASE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save master lease state:", e);
    }
  }

  public isMasterDevice(): boolean {
    return this.state.isMasterDevice;
  }

  public getMasterDeviceName(): string {
    return this.state.masterDeviceName;
  }

  public setMasterDevice(isMaster: boolean, deviceName?: string) {
    this.saveLeaseState({
      ...this.state,
      isMasterDevice: isMaster,
      masterDeviceName: deviceName || (isMaster ? 'हा फोन (This Primary Device)' : 'दुसरा फोन (Other Master Device)')
    });
  }

  /**
   * Verifies if cash box disbursals / loan sanctions are permitted on this device
   */
  public verifyCanMutateCashBox(): { allowed: boolean; reason?: string } {
    if (this.isMasterDevice()) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `हा फोन गौण (Secondary) डिव्हाइस आहे. रोख कर्ज वाटप केवळ मुख्य डिव्हाइसवरून (${this.state.masterDeviceName}) करता येऊ शकते.`
    };
  }
}

export const masterLeaseService = new MasterLeaseService();

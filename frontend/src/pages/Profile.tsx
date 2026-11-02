import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import {
  User,
  ShieldCheck,
  Bike,
  Phone,
  FileText,
  Plus,
  Heart,
  Save,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, fetchProfile } = useAuthStore();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    licensePlate: '',
    make: '',
    model: '',
    engineCc: 150,
    color: '',
    rcNumber: '',
    rcDocumentUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
    insurancePolicyNo: '',
    insuranceExpiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    insuranceDocUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
  });

  const [contactForm, setContactForm] = useState({
    contactName: '',
    relationship: 'Family',
    phoneNumber: '+91',
    isPrimary: true,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName,
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile(profileForm);
      await fetchProfile();
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingVehicle(true);
    try {
      // Ensure rider profile exists first
      if (!user?.riderProfile) {
        await api.createRiderProfile({
          drivingLicenseNo: `DL-${Date.now().toString().slice(-6)}`,
          licenseExpiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000 * 5).toISOString().slice(0, 10),
          licenseDocFrontUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
        });
      }

      const payload = {
        ...vehicleForm,
        licensePlate: vehicleForm.licensePlate.trim().toUpperCase(),
        rcNumber: vehicleForm.rcNumber.trim().toUpperCase(),
        insurancePolicyNo:
          vehicleForm.insurancePolicyNo.trim() || `POL-${Math.floor(10000000 + Math.random() * 90000000)}`,
      };

      await api.addVehicle(payload);
      await fetchProfile();
      setShowVehicleModal(false);
      alert('Vehicle registered successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to add vehicle');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingContact(true);
    try {
      await api.addEmergencyContact(contactForm);
      await fetchProfile();
      setShowContactModal(false);
      alert('Emergency contact added!');
    } catch (err: any) {
      alert(err.message || 'Failed to add emergency contact');
    } finally {
      setAddingContact(false);
    }
  };

  if (!user) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const vehicles = user.riderProfile?.vehicles || [];
  const contacts = user.emergencyContacts || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Profile & Account Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage your credentials, vehicles, and emergency contacts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Personal info & Emergency contacts */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base">
                  {user.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white">{user.fullName}</h3>
                  <span className="text-xs text-slate-400 font-mono">{user.phoneNumber}</span>
                </div>
              </div>

              <Badge variant="success" className="gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{user.kycStatus}</span>
              </Badge>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
              <Input
                label="Full Name"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Bio / Commute Routine
                </label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="e.g. Daily software engineer commuter from Koramangala to Manyata Tech Park"
                  className="w-full p-3 rounded-xl glass-input text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <Button type="submit" variant="primary" size="sm" isLoading={savingProfile}>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </Button>
            </form>
          </Card>

          {/* Emergency Contacts Card */}
          <Card className="p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Emergency Contacts ({contacts.length})
                </h3>
              </div>

              <Button variant="secondary" size="sm" onClick={() => setShowContactModal(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </Button>
            </div>

            {contacts.length > 0 ? (
              <div className="space-y-2.5">
                {contacts.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl glass-panel flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{c.contactName}</span>
                      <span className="text-slate-500 ml-2">({c.relationship})</span>
                      <div className="text-slate-400 font-mono text-[11px]">{c.phoneNumber}</div>
                    </div>
                    {c.isPrimary && <Badge variant="secondary">Primary</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Add an emergency contact to enable 1-tap SOS distress broadcasts.
              </p>
            )}
          </Card>
        </div>

        {/* Right Column: Registered Vehicles & Rider Credentials */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Registered Two-Wheelers ({vehicles.length})
                </h3>
              </div>

              <Button variant="primary" size="sm" onClick={() => setShowVehicleModal(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bike</span>
              </Button>
            </div>

            {vehicles.length > 0 ? (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl glass-panel space-y-2 text-xs border border-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white text-sm">
                          {v.make} {v.model} ({v.color})
                        </div>
                        <div className="text-emerald-400 font-mono font-semibold">{v.licensePlate}</div>
                      </div>
                      <Badge variant="success">Verified RC</Badge>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                      <span>Engine: {v.engineCc} cc</span>
                      <span>RC: {v.rcNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                <p>No vehicles registered. Add your motorcycle to publish ride offers.</p>
                <Button variant="secondary" size="sm" onClick={() => setShowVehicleModal(true)}>
                  Register Your Bike
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Register Two-Wheeler</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <Input
                label="Make & Brand"
                placeholder="e.g. Yamaha, Honda, Royal Enfield"
                value={vehicleForm.make}
                onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                required
              />
              <Input
                label="Model"
                placeholder="e.g. FZ-S, Activa 6G, Classic 350"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="License Plate"
                  placeholder="KA-01-EQ-9812"
                  value={vehicleForm.licensePlate}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value })}
                  required
                />
                <Input
                  label="Color"
                  placeholder="Black"
                  value={vehicleForm.color}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Engine Displacement (CC)"
                  type="number"
                  value={vehicleForm.engineCc}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, engineCc: parseInt(e.target.value) || 150 })}
                  required
                />
                <Input
                  label="RC Registration No."
                  placeholder="RC987123"
                  value={vehicleForm.rcNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, rcNumber: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Insurance Policy No. (Optional)"
                placeholder="e.g. POL-98712345 (Auto-generated if blank)"
                value={vehicleForm.insurancePolicyNo}
                onChange={(e) => setVehicleForm({ ...vehicleForm, insurancePolicyNo: e.target.value })}
              />

              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={addingVehicle}>
                Verify & Register Vehicle
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Add Emergency Contact</h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3 text-xs">
              <Input
                label="Contact Name"
                placeholder="e.g. Ramesh Sen"
                value={contactForm.contactName}
                onChange={(e) => setContactForm({ ...contactForm, contactName: e.target.value })}
                required
              />
              <Input
                label="Relationship"
                placeholder="e.g. Father, Spouse, Colleague"
                value={contactForm.relationship}
                onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                required
              />
              <Input
                label="Mobile Phone Number (E.164)"
                placeholder="+919876543210"
                value={contactForm.phoneNumber}
                onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                required
              />

              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={addingContact}>
                Save Contact
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import './App.css';

// --- Data Lists ---
const BANK_LIST = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Punjab National Bank",
  "Bank of Baroda", "Axis Bank", "Kotak Mahindra Bank", "IndusInd Bank",
  "Union Bank of India", "Canara Bank", "Other"
];

const CAPACITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // kW

function App() {
  const [step, setStep] = useState(1);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [isSharing, setIsSharing] = useState(false); // Replaces "isSending"

  // --- Form State ---
  const [formData, setFormData] = useState({
    nameBank: '', nameBill: '', nameAadhar: '', mobile: '', email: '', address: '',
    kNumber: '', sanctionedLoad: '', proposedCapacity: '', city: '', latitude: '', longitude: '',
    bankName: '', accountNumber: '', ifsc: '', branchAddress: '',
    sitePhoto: null, aadharCard: null, panCard: null, lightBill: null, bankPassbook: null
  });

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const url = URL.createObjectURL(files[0]);
      setFormData(prev => ({ ...prev, [name]: url }));
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setLoadingLoc(false);
      },
      (error) => {
        alert("Unable to retrieve location. Please enter manually.");
        setLoadingLoc(false);
      }
    );
  };

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(prev => prev - 1);
  };

  // --- PDF & Share Logic ---
  const previewRef = useRef();

  // 1. Download Function (Fallback)
  const downloadPDF = () => {
    const element = previewRef.current;
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Solar_Reg_${formData.nameAadhar || 'Client'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // 2. Share Function (The Fix)
  const sharePDF = async () => {
    setIsSharing(true);

    const element = previewRef.current;
    
    // Config: Standard quality
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Solar_Reg_${formData.nameAadhar || 'Client'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // A. Generate PDF Blob
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

      // B. Create File Object
      const file = new File([pdfBlob], `Solar_Reg_${formData.nameAadhar || 'Client'}.pdf`, {
        type: "application/pdf",
      });

      // C. Prepare Share Data
      const shareData = {
        title: "Solar Registration Form",
        text: `Please find the registration details for ${formData.nameAadhar} attached.\nCity: ${formData.city}\nMobile: ${formData.mobile}`,
        files: [file],
        mails:"solarbhanvi@gmail.com"
      };

      // D. Try to Share (Mobile/Supported Browsers)
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // E. Fallback for Desktop (No native share)
        alert("Native sharing not supported on this device. Downloading file...");
        downloadPDF();
        // Optional: Open mail client (without attachment)
        window.location.href = `mailto:${shareData.mails}?subject=Solar Registration: ${formData.nameAadhar}&body=Please attach the downloaded PDF.`;
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Ignore 'AbortError' (User cancelled share menu)
      if (err.name !== 'AbortError') {
        alert("Error generating share file. Downloading instead.");
        downloadPDF();
      }
    } finally {
      setIsSharing(false);
    }
  };

  // --- Render Steps ---
  const renderStep1 = () => (
    <div className="form-section fade-in">
      <div className="section-header">
        <h2>Customer Details</h2>
        <p>Personal information as per documents</p>
      </div>
      <div className="form-grid">
        <div className="input-group">
          <label>Name (As per Bank)</label>
          <input type="text" name="nameBank" value={formData.nameBank} onChange={handleChange} placeholder="e.g. Rahul Kumar" />
        </div>
        <div className="input-group">
          <label>Name (As per Light Bill)</label>
          <input type="text" name="nameBill" value={formData.nameBill} onChange={handleChange} placeholder="e.g. Rahul K." />
        </div>
        <div className="input-group full-width">
          <label>Name (As per Aadhar Card)</label>
          <input type="text" name="nameAadhar" value={formData.nameAadhar} onChange={handleChange} placeholder="e.g. Rahul Kumar Singh" />
        </div>
        <div className="input-group">
          <label>Mobile Number</label>
          <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10 Digit No." />
        </div>
        <div className="input-group">
          <label>Email ID</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" />
        </div>
        <div className="input-group full-width">
          <label>Address (with PIN)</label>
          <textarea name="address" rows="3" value={formData.address} onChange={handleChange} placeholder="Full address"></textarea>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-section fade-in">
      <div className="section-header">
        <h2>Technical Details</h2>
        <p>Site and connection information</p>
      </div>
      <div className="form-grid">
        <div className="input-group">
          <label>K Number</label>
          <input type="text" name="kNumber" value={formData.kNumber} onChange={handleChange} placeholder="Consumer No." />
        </div>
        <div className="input-group">
          <label>Sanctioned Load (kW)</label>
          <input type="number" name="sanctionedLoad" value={formData.sanctionedLoad} onChange={handleChange} placeholder="e.g. 4" />
        </div>
        <div className="input-group full-width">
          <label>Proposed Capacity</label>
          <select name="proposedCapacity" value={formData.proposedCapacity} onChange={handleChange}>
            <option value="">Select Capacity</option>
            {CAPACITIES.map(c => <option key={c} value={`${c} kW`}>{c} kW</option>)}
          </select>
        </div>

        <div className="input-group full-width">
          <label>City / Village</label>
          <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Installation City" />
        </div>

        <div className="input-group">
          <label>Latitude</label>
          <input className="read-only" type="text" name="latitude" value={formData.latitude} readOnly placeholder="--" />
        </div>
        <div className="input-group">
          <label>Longitude</label>
          <input className="read-only" type="text" name="longitude" value={formData.longitude} readOnly placeholder="--" />
        </div>

        <div className="input-group full-width">
          <button className={`btn btn-loc ${loadingLoc ? 'pulsing' : ''}`} onClick={getLocation} type="button">
            {loadingLoc ? "Detecting..." : <span><i className="fa-solid fa-location-crosshairs"></i> Get Current Location</span>}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-section fade-in">
      <div className="section-header">
        <h2>Bank Details</h2>
        <p>For subsidy disbursement</p>
      </div>
      <div className="form-grid">
        <div className="input-group full-width">
          <label>Bank Name</label>
          <select name="bankName" value={formData.bankName} onChange={handleChange}>
            <option value="">Select Bank</option>
            {BANK_LIST.map(bank => <option key={bank} value={bank}>{bank}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Account Number</label>
          <input type="tel" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Account No." />
        </div>
        <div className="input-group">
          <label>IFSC Code</label>
          <input type="text" name="ifsc" value={formData.ifsc} onChange={handleChange} placeholder="IFSC Code" />
        </div>
        <div className="input-group full-width">
          <label>Branch Address</label>
          <input type="text" name="branchAddress" value={formData.branchAddress} onChange={handleChange} placeholder="Branch Name" />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="form-section fade-in">
      <div className="section-header">
        <h2>Documents</h2>
        <p>Upload clear photos</p>
      </div>
      <div className="form-grid">
        {[
          { id: 'sitePhoto', label: 'Site Photo', icon: 'fa-house' },
          { id: 'aadharCard', label: 'Aadhar Card', icon: 'fa-id-card' },
          { id: 'panCard', label: 'PAN Card', icon: 'fa-address-card' },
          { id: 'lightBill', label: 'Light Bill', icon: 'fa-bolt' },
          { id: 'bankPassbook', label: 'Passbook', icon: 'fa-book-open' }
        ].map((file) => (
          <div key={file.id} className="file-card">
            <div className="file-info">
              <i className={`fa-solid ${file.icon} file-icon`}></i>
              <span>{file.label}</span>
            </div>

            <input type="file" id={file.id} name={file.id} onChange={handleFileChange} accept="image/*" className="hidden-input" />

            <div className="file-action">
              {!formData[file.id] ? (
                <label htmlFor={file.id} className="upload-btn">Upload</label>
              ) : (
                <div className="preview-mini">
                  <img src={formData[file.id]} alt="doc" />
                  <label htmlFor={file.id} className="edit-btn"><i className="fa-solid fa-pen"></i></label>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="form-section fade-in">
      <div className="section-header">
        <h2>Review & Share</h2>
        <p>Review details before submitting</p>
      </div>

      {/* WRAPPER FOR HORIZONTAL SCROLL ON MOBILE */}
      <div className="pdf-scroll-wrapper">
        <div id="pdf-content" ref={previewRef} className="pdf-paper">

          <div className="pdf-header">
            <div className="brand">
              <h1>PM SURYA GHAR</h1>
              <span>Registration Form</span>
            </div>
            <div className="date">Date: {new Date().toLocaleDateString()}</div>
          </div>

          <div className="pdf-body">
            <div className="pdf-block prevent-break">
              <h3>1. Customer Details</h3>
              <PreviewRow label="Name (Bank)" value={formData.nameBank} />
              <PreviewRow label="Name (Aadhar)" value={formData.nameAadhar} />
              <PreviewRow label="Mobile" value={formData.mobile} />
              <PreviewRow label="Email" value={formData.email} />
              <PreviewRow label="Address" value={formData.address} />
            </div>

            <div className="pdf-block prevent-break">
              <h3>2. Technical Details</h3>
              <PreviewRow label="K Number" value={formData.kNumber} />
              <PreviewRow label="Load / Capacity" value={`${formData.sanctionedLoad || 0} kW / ${formData.proposedCapacity || '-'}`} />
              <PreviewRow label="Location" value={`${formData.city} (${formData.latitude}, ${formData.longitude})`} />
            </div>

            <div className="pdf-block prevent-break">
              <h3>3. Bank Details</h3>
              <PreviewRow label="Bank" value={formData.bankName} />
              <PreviewRow label="Account / IFSC" value={`${formData.accountNumber} / ${formData.ifsc}`} />
            </div>

            <div className="pdf-block">
              <h3>4. Attachments</h3>
              <div className="pdf-gallery">
                {['sitePhoto', 'aadharCard', 'panCard', 'lightBill', 'bankPassbook'].map(key => (
                  formData[key] && (
                    <div key={key} className="pdf-img-box prevent-break">
                      <div className="box-label">{key}</div>
                      <img src={formData[key]} alt={key} />
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="pdf-footer prevent-break">
              <div className="sign-line">Customer Signature</div>
              <div className="sign-line">Vendor Signature</div>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons-vertical">
        <button className="btn btn-primary btn-lg" onClick={sharePDF} disabled={isSharing}>
          {isSharing ? (
            <span><i className="fa-solid fa-spinner fa-spin"></i> Preparing to Share...</span>
          ) : (
            <span><i className="fa-solid fa-share-nodes"></i> Share PDF (Email/WhatsApp)</span>
          )}
        </button>

        <button className="btn btn-secondary btn-lg" onClick={downloadPDF} disabled={isSharing}>
          <i className="fa-solid fa-download"></i> Download Only
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="main-card">

        <div className="app-header">
          <h1>PM Surya Ghar</h1>
          <p>Bhanvi Solar Registration</p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`}>
              {step > s ? '✓' : s}
            </div>
          ))}
          <div className="step-bar-bg">
            <div className="step-bar-fill" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
          </div>
        </div>

        <form onSubmit={e => e.preventDefault()}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          {step < 5 && (
            <div className="nav-buttons">
              {step > 1 ? (
                <button className="btn btn-secondary" onClick={prevStep} type="button">
                  <i className="fa-solid fa-arrow-left"></i> Previous
                </button>
              ) : (
                <div></div>
              )}

              <button className="btn btn-primary" onClick={nextStep} type="button">
                Next <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}

const PreviewRow = ({ label, value }) => (
  <div className="pdf-row">
    <span className="p-label">{label}</span>
    <span className="p-value">{value || '-'}</span>
  </div>
);

export default App;
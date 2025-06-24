import { useState } from "react";

const AddData = () => {
  const [formData, setFormData] = useState({
    company: {
      cin: "",
      name: "",
      state: "",
      paid_capital: "",
      inc_date: "",
      address: "",
      category: "",
      sub_category: "",
      activity: ""
    },
    director: {
      din: "",
      name: "",
      designation: "",
      appointment_date: ""
    },
    otherCompanies: []
  });

  const [otherCompany, setOtherCompany] = useState({
    cin: "",
    name: "",
    designation: "",
    appointment_date: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[`${section}.${field}`]) {
      setValidationErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: ""
      }));
    }
  };

  const handleOtherCompanyChange = (field, value) => {
    setOtherCompany(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addOtherCompany = () => {
    if (otherCompany.cin && otherCompany.name) {
      setFormData(prev => ({
        ...prev,
        otherCompanies: [...prev.otherCompanies, { ...otherCompany }]
      }));
      setOtherCompany({
        cin: "",
        name: "",
        designation: "",
        appointment_date: ""
      });
    }
  };

  const removeOtherCompany = (index) => {
    setFormData(prev => ({
      ...prev,
      otherCompanies: prev.otherCompanies.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.company.cin) errors['company.cin'] = 'CIN is required';
    if (!formData.company.name) errors['company.name'] = 'Company name is required';
    if (!formData.director.din) errors['director.din'] = 'DIN is required';
    if (!formData.director.name) errors['director.name'] = 'Director name is required';
    if (!formData.director.designation) errors['director.designation'] = 'Designation is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Please fix the validation errors before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/form/company-director", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          company: {
            cin: "",
            name: "",
            state: "",
            paid_capital: "",
            inc_date: "",
            address: "",
            category: "",
            sub_category: "",
            activity: ""
          },
          director: {
            din: "",
            name: "",
            designation: "",
            appointment_date: ""
          },
          otherCompanies: []
        });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        if (result.errors) {
          const backendErrors = {};
          result.errors.forEach(err => {
            backendErrors[err.path] = err.msg;
          });
          setValidationErrors(backendErrors);
        }
        setError(result.message || "Failed to submit form");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Form submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      company: {
        cin: "",
        name: "",
        state: "",
        paid_capital: "",
        inc_date: "",
        address: "",
        category: "",
        sub_category: "",
        activity: ""
      },
      director: {
        din: "",
        name: "",
        designation: "",
        appointment_date: ""
      },
      otherCompanies: []
    });
    setValidationErrors({});
    setError("");
    setSuccess(false);
  };

  const InputField = ({ label, value, onChange, error, required = false, type = "text", placeholder, className = "" }) => (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full p-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-slate-600 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'
        }`}
      />
      {error && (
        <p className="text-red-400 text-sm flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 transform transition-all duration-500 ease-out animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Company Director Registration
          </h1>
          <p className="text-slate-400 text-lg">Add company and director information to the network database</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 transform transition-all duration-500 ease-out animate-slide-down">
            <div className="bg-green-900/20 border border-green-500/50 text-green-300 px-6 py-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <strong>Success!</strong>
                <span>Company and director information has been successfully added to the database.</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 transform transition-all duration-500 ease-out animate-slide-down">
            <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <strong>Error:</strong>
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-2xl transform transition-all duration-500 ease-out animate-fade-in-up">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white">Company Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <InputField
                label="Corporate Identification Number (CIN)"
                value={formData.company.cin}
                onChange={(e) => handleInputChange('company', 'cin', e.target.value)}
                error={validationErrors['company.cin']}
                required
                placeholder="e.g., L12345MH2020PLC123456"
              />
              <InputField
                label="Company Name"
                value={formData.company.name}
                onChange={(e) => handleInputChange('company', 'name', e.target.value)}
                error={validationErrors['company.name']}
                required
                placeholder="Enter company name"
              />
              <InputField
                label="State"
                value={formData.company.state}
                onChange={(e) => handleInputChange('company', 'state', e.target.value)}
                placeholder="Enter state"
              />
              <InputField
                label="Paid Up Capital"
                value={formData.company.paid_capital}
                onChange={(e) => handleInputChange('company', 'paid_capital', e.target.value)}
                type="number"
                placeholder="Enter amount"
              />
              <InputField
                label="Incorporation Date"
                value={formData.company.inc_date}
                onChange={(e) => handleInputChange('company', 'inc_date', e.target.value)}
                type="date"
              />
              <InputField
                label="Category"
                value={formData.company.category}
                onChange={(e) => handleInputChange('company', 'category', e.target.value)}
                placeholder="e.g., Public, Private"
              />
              <InputField
                label="Sub Category"
                value={formData.company.sub_category}
                onChange={(e) => handleInputChange('company', 'sub_category', e.target.value)}
                placeholder="Enter sub category"
                className="md:col-span-2"
              />
              <InputField
                label="Address"
                value={formData.company.address}
                onChange={(e) => handleInputChange('company', 'address', e.target.value)}
                placeholder="Enter company address"
                className="md:col-span-2"
              />
              <InputField
                label="Business Activity"
                value={formData.company.activity}
                onChange={(e) => handleInputChange('company', 'activity', e.target.value)}
                placeholder="Describe primary business activity"
                className="md:col-span-2"
              />
            </div>
          </div>

          {/* Director Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-2xl transform transition-all duration-500 ease-out animate-fade-in-up delay-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white">Director Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <InputField
                label="Director Identification Number (DIN)"
                value={formData.director.din}
                onChange={(e) => handleInputChange('director', 'din', e.target.value)}
                error={validationErrors['director.din']}
                required
                placeholder="e.g., 12345678"
              />
              <InputField
                label="Director Name"
                value={formData.director.name}
                onChange={(e) => handleInputChange('director', 'name', e.target.value)}
                error={validationErrors['director.name']}
                required
                placeholder="Enter director's full name"
              />
              <InputField
                label="Designation"
                value={formData.director.designation}
                onChange={(e) => handleInputChange('director', 'designation', e.target.value)}
                error={validationErrors['director.designation']}
                required
                placeholder="e.g., Managing Director, Executive Director"
              />
              <InputField
                label="Appointment Date"
                value={formData.director.appointment_date}
                onChange={(e) => handleInputChange('director', 'appointment_date', e.target.value)}
                type="date"
              />
            </div>
          </div>

          {/* Other Companies */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-2xl transform transition-all duration-500 ease-out animate-fade-in-up delay-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white">Other Associated Companies</h2>
              <span className="text-sm text-slate-400">(Optional)</span>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <InputField
                  label="Company CIN"
                  value={otherCompany.cin}
                  onChange={(e) => handleOtherCompanyChange('cin', e.target.value)}
                  placeholder="Enter CIN"
                />
                <InputField
                  label="Company Name"
                  value={otherCompany.name}
                  onChange={(e) => handleOtherCompanyChange('name', e.target.value)}
                  placeholder="Enter name"
                />
                <InputField
                  label="Designation"
                  value={otherCompany.designation}
                  onChange={(e) => handleOtherCompanyChange('designation', e.target.value)}
                  placeholder="Enter designation"
                />
                <div className="space-y-2">
                  <InputField
                    label="Appointment Date"
                    value={otherCompany.appointment_date}
                    onChange={(e) => handleOtherCompanyChange('appointment_date', e.target.value)}
                    type="date"
                  />
                  <button
                    type="button"
                    onClick={addOtherCompany}
                    disabled={!otherCompany.cin || !otherCompany.name}
                    className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {formData.otherCompanies.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-slate-300 font-medium">Added Companies:</h4>
                  {formData.otherCompanies.map((company, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700/40 rounded-lg border border-slate-600">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">CIN:</span>
                          <p className="text-white font-medium">{company.cin}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Name:</span>
                          <p className="text-white font-medium">{company.name}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Designation:</span>
                          <p className="text-white font-medium">{company.designation || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Date:</span>
                          <p className="text-white font-medium">{company.appointment_date || 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOtherCompany(index)}
                        className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-300"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end transform transition-all duration-500 ease-out animate-fade-in-up delay-300">
            <button
              type="button"
              onClick={resetForm}
              className="px-8 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>Reset Form</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 ease-in-out transform
                ${loading
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-lg active:scale-95"
                }
                ${loading ? "animate-pulse" : ""}
              `}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Submit Registration</span>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-12 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700 transform transition-all duration-500 ease-out animate-fade-in delay-400">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Form Guidelines</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-400">
            <div>
              <h4 className="text-slate-300 font-medium mb-2">Required Fields</h4>
              <ul className="space-y-1">
                <li>• Company CIN (Corporate Identification Number)</li>
                <li>• Company Name</li>
                <li>• Director DIN (Director Identification Number)</li>
                <li>• Director Name and Designation</li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-300 font-medium mb-2">Additional Information</h4>
              <ul className="space-y-1">
                <li>• All other fields are optional but recommended</li>
                <li>• You can add multiple associated companies</li>
                <li>• Date fields should be in YYYY-MM-DD format</li>
                <li>• Data will be stored in the Neo4j graph database</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-slide-down {
          animation: slide-down 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AddData;
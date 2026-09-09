import React, { useState, useEffect } from 'react';
import AppLogo from './AppLogo';
import { KeyRound, Mail, User, Phone, Briefcase, Eye, EyeOff, ShieldAlert, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import { auth, googleProvider, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthGateProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthGate({ onLoginSuccess }: AuthGateProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [viewState, setViewState] = useState<'auth' | 'forgotPassword' | 'emailVerification'>('auth');
  
  // Field States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'personal' | 'company'>('personal');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // Phone Auth States
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Validation states derived for tick show
  const isNameValid = name.trim().length >= 3;
  const isPhoneValid = phone.length === 11 || phone.startsWith('+'); // allow +880 format for firebase
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isCompanyValid = userType !== 'company' || (companyName.trim().length >= 3 && companyAddress.trim().length >= 3);
  const isPasswordValid = password.length >= 6;
  const isConfirmPasswordValid = isPasswordValid && password === confirmPassword;

  // Visual options
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Setup recaptcha for phone auth
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved
        }
      });
    }

    // Check if the user is already logged in but not verified
    const checkUnverifiedUser = async () => {
      if (auth.currentUser && auth.currentUser.providerData.some(p => p.providerId === 'password') && !auth.currentUser.emailVerified) {
        setEmail(auth.currentUser.email || '');
        setViewState('emailVerification');
      }
    };
    // Need to give Firebase a moment to load auth state if it wasn't already available
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user && user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
        setEmail(user.email || '');
        setViewState('emailVerification');
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleFirebaseUser = async (firebaseUser: any, extraData: any = {}, skipLogin: boolean = false) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    let userData;
    if (!userDoc.exists()) {
      // Create new user profile in Firestore
      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        phone: firebaseUser.phoneNumber || extraData.phone || '',
        name: firebaseUser.displayName || extraData.name || 'নতুন ইউজার',
        userType: extraData.userType || 'personal',
        companyName: extraData.companyName || '',
        companyAddress: extraData.companyAddress || '',
        tokenLimit: 20, // default limit
        isAdmin: firebaseUser.email === 'ahkmultizone33@gmail.com',
        createdAt: serverTimestamp()
      };
      await setDoc(userDocRef, userData);
    } else {
      userData = { id: firebaseUser.uid, ...userDoc.data() };
      // Ensure super admin gets rights if they log in via other means
      if (firebaseUser.email === 'ahkmultizone33@gmail.com' && !userData.isAdmin) {
         userData.isAdmin = true;
         await setDoc(userDocRef, { isAdmin: true }, { merge: true });
      }
    }
    
    if (!skipLogin) {
      onLoginSuccess(userData);
    }
    return userData;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        setViewState('emailVerification');
        setIsLoading(false);
        return;
      }

      await handleFirebaseUser(userCredential.user);
    } catch (error: any) {
      console.error(error);
      setErrorMessage('ভুল ইমেইল বা পাসওয়ার্ড।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!isEmailValid) {
      setErrorMessage('সঠিক ইমেইল ঠিকানা দিন।');
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage('পাসওয়ার্ড অন্তত ৬ ক্যারেক্টারের হতে হবে।');
      return;
    }
    if (!isConfirmPasswordValid) {
      setErrorMessage('পাসওয়ার্ড মিলছে না।');
      return;
    }
    if (!isNameValid || (!isCompanyValid && userType === 'company')) {
      setErrorMessage('সব ফিল্ড সঠিকভাবে পূরণ করুন।');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await sendEmailVerification(userCredential.user);

      // Save user to firestore, but skip calling onLoginSuccess
      await handleFirebaseUser(userCredential.user, {
        name,
        phone,
        userType,
        companyName: userType === 'company' ? companyName : '',
        companyAddress: userType === 'company' ? companyAddress : ''
      }, true);

      setViewState('emailVerification');
      setSuccessMessage('আপনার ইমেইলে একটি ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে। দয়া করে ইনবক্স চেক করুন।');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে।');
      } else {
        setErrorMessage('রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isEmailValid) {
      setErrorMessage('সঠিক ইমেইল ঠিকানা দিন।');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে। দয়া করে ইমেইল চেক করুন।');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('এই ইমেইলের কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
      } else {
        setErrorMessage('পাসওয়ার্ড রিসেট লিঙ্ক পাঠাতে সমস্যা হয়েছে।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailVerification = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          await handleFirebaseUser(auth.currentUser);
        } else {
          setErrorMessage('ইমেইল এখনও ভেরিফাই করা হয়নি। দয়া করে লিঙ্কে ক্লিক করে ভেরিফাই করুন।');
        }
      } else {
        setViewState('auth');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage('ভেরিফিকেশন চেক করতে সমস্যা হয়েছে। পুনরায় লগইন করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleFirebaseUser(result.user);
    } catch (error: any) {
      console.error(error);
      setErrorMessage('গুগল লগইন ব্যর্থ হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    let formattedPhone = phone;
    if (formattedPhone.length === 11 && formattedPhone.startsWith('01')) {
      formattedPhone = '+88' + formattedPhone;
    }

    if (!formattedPhone.startsWith('+')) {
      setErrorMessage('সঠিক মোবাইল নম্বর দিন (যেমন +88017... বা 017...)');
      return;
    }

    setIsLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setShowOtpField(true);
      setSuccessMessage('আপনার মোবাইলে একটি ওটিপি পাঠানো হয়েছে।');
    } catch (error: any) {
      console.error(error);
      setErrorMessage('ওটিপি পাঠাতে সমস্যা হয়েছে। নম্বর চেক করুন।');
      // Reset recaptcha
      if (window.recaptchaVerifier) window.recaptchaVerifier.render().then((widgetId: any) => window.grecaptcha.reset(widgetId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await handleFirebaseUser(result.user, {
         // If they were registering via phone, save these
         name: name || 'নতুন ইউজার',
         userType,
         companyName: userType === 'company' ? companyName : '',
         companyAddress: userType === 'company' ? companyAddress : ''
      });
    } catch (error: any) {
      console.error(error);
      setErrorMessage('ভুল ওটিপি কোড।');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAuthForm = () => (
    <>
      <div className="flex border-b border-slate-200 pb-3 justify-center gap-6">
        <button
          onClick={() => {
            setIsLogin(true);
            setErrorMessage(null);
            setSuccessMessage(null);
            setShowOtpField(false);
          }}
          className={`text-sm font-bold pb-2 transition-all relative ${
            isLogin ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          লগইন করুন
          {isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
        </button>
        <button
          onClick={() => {
            setIsLogin(false);
            setErrorMessage(null);
            setSuccessMessage(null);
            setShowOtpField(false);
          }}
          className={`text-sm font-bold pb-2 transition-all relative ${
            !isLogin ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          নতুন অ্যাকাউন্ট খুলুন
          {!isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
        </button>
      </div>

      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setAuthMethod('email')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            authMethod === 'email' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
          }`}
        >
          ইমেইল
        </button>
        <button
          onClick={() => setAuthMethod('phone')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            authMethod === 'phone' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
          }`}
        >
          মোবাইল নম্বর
        </button>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs py-3 px-4 rounded-xl flex items-start gap-2 animate-pulse">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs py-3 px-4 rounded-xl flex items-start gap-2">
          <Check size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Login or Register Form */}
      {authMethod === 'email' ? (
        <form onSubmit={isLogin ? handleEmailLogin : handleEmailRegister} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('personal')}
                  className={`py-2 px-3 text-xs rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    userType === 'personal'
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <User size={13} /> ব্যক্তিগত
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('company')}
                  className={`py-2 px-3 text-xs rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    userType === 'company'
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Briefcase size={13} /> কোম্পানি
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">পূর্ণ নাম</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><User size={15} /></span>
                  <input type="text" required placeholder="নাম" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-xs pl-9 pr-4 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              
              {userType === 'company' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700">কোম্পানির নাম</label>
                    <input type="text" required placeholder="কোম্পানির নাম" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full text-xs px-4 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700">কোম্পানির ঠিকানা</label>
                    <input type="text" required placeholder="ঠিকানা" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="w-full text-xs px-4 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
                  </div>
                </>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">মোবাইল নম্বর</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Phone size={15} /></span>
                  <input type="tel" required placeholder="01711223344" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full text-xs pl-9 pr-4 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700">ইমেইল ঠিকানা</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Mail size={15} /></span>
              <input type="email" required placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs pl-9 pr-4 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-700">পাসওয়ার্ড</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setViewState('forgotPassword');
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-600 transition-colors"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><KeyRound size={15} /></span>
              <input type={showPassword ? 'text' : 'password'} required minLength={6} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-xs pl-9 pr-10 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 cursor-pointer">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">পাসওয়ার্ড নিশ্চিত করুন</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><KeyRound size={15} /></span>
                <input type={showPassword ? 'text' : 'password'} required minLength={6} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full text-xs pl-9 pr-10 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          )}

          <button disabled={isLoading} type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 cursor-pointer">
            {isLoading ? 'অপেক্ষা করুন...' : (isLogin ? 'লগইন সম্পন্ন করুন' : 'নিবন্ধন সম্পন্ন করুন')}
          </button>
        </form>
      ) : (
        <form onSubmit={showOtpField ? handleVerifyOtp : handleSendOtp} className="space-y-4">
          {!isLogin && !showOtpField && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setUserType('personal')} className={`py-2 px-3 text-xs rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${userType === 'personal' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}><User size={13} /> ব্যক্তিগত</button>
                <button type="button" onClick={() => setUserType('company')} className={`py-2 px-3 text-xs rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${userType === 'company' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}><Briefcase size={13} /> কোম্পানি</button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">পূর্ণ নাম</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><User size={15} /></span>
                  <input type="text" required placeholder="নাম" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-xs pl-9 pr-4 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </>
          )}

          {!showOtpField ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">মোবাইল নম্বর</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Phone size={15} /></span>
                <input type="tel" required placeholder="01711223344" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full text-xs pl-9 pr-4 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">ওটিপি কোড</label>
              <input type="text" required placeholder="৬ ডিজিটের কোড" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full text-center tracking-widest text-lg px-4 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
            </div>
          )}

          <button disabled={isLoading} type="submit" id="sign-in-button" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 cursor-pointer">
            {isLoading ? 'অপেক্ষা করুন...' : (showOtpField ? 'যাচাই করুন' : 'ওটিপি (OTP) পাঠান')}
          </button>
        </form>
      )}

      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="shrink-0 px-3 text-slate-500 text-[10px]">অথবা</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <button 
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:bg-slate-50 transition-all text-slate-700 font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        গুগল দিয়ে লগইন/রেজিস্টার করুন
      </button>
      
      <div id="recaptcha-container"></div>
    </>
  );

  const renderForgotPassword = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button 
          onClick={() => {
            setViewState('auth');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="text-sm font-bold text-slate-800">পাসওয়ার্ড রিসেট করুন</h3>
      </div>
      
      <p className="text-xs text-slate-500 leading-relaxed">
        আপনার অ্যাকাউন্টের ইমেইল ঠিকানা দিন। আমরা আপনাকে একটি লিঙ্ক পাঠাব যা দিয়ে আপনি নতুন পাসওয়ার্ড সেট করতে পারবেন।
      </p>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs py-3 px-4 rounded-xl flex items-start gap-2 animate-pulse">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs py-3 px-4 rounded-xl flex items-start gap-2">
          <Check size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700">ইমেইল ঠিকানা</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Mail size={15} /></span>
            <input type="email" required placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs pl-9 pr-4 py-3 bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <button disabled={isLoading} type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 cursor-pointer mt-2">
          {isLoading ? 'অপেক্ষা করুন...' : 'পাসওয়ার্ড রিসেট লিঙ্ক পাঠান'}
        </button>
      </form>
    </div>
  );

  const renderEmailVerification = () => (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 bg-indigo-500/20 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
        <Mail size={32} />
      </div>
      
      <h3 className="text-lg font-bold text-slate-800">ইমেইল ভেরিফাই করুন</h3>
      
      <p className="text-xs text-slate-500 leading-relaxed px-4">
        আমরা আপনার ইমেইলে (<strong className="text-indigo-600">{email}</strong>) একটি ভেরিফিকেশন লিঙ্ক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স (বা স্প্যাম ফোল্ডার) চেক করুন এবং লিঙ্কে ক্লিক করে ভেরিফাই করুন।
      </p>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs py-3 px-4 rounded-xl flex items-start text-left gap-2 animate-pulse mx-auto">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs py-3 px-4 rounded-xl flex items-start text-left gap-2 mx-auto">
          <Check size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="pt-4 space-y-3">
        <button 
          onClick={checkEmailVerification}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 cursor-pointer"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'চেক করা হচ্ছে...' : 'আমি ভেরিফাই করেছি'}
        </button>

        <button 
          onClick={async () => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setIsLoading(true);
            try {
              if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                setSuccessMessage('নতুন করে ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে। দয়া করে আপনার ইনবক্স এবং স্প্যাম (Spam) ফোল্ডার চেক করুন।');
              } else {
                setErrorMessage('ইউজার পাওয়া যায়নি। দয়া করে আবার লগইন করুন।');
              }
            } catch (error: any) {
              console.error(error);
              if (error.code === 'auth/too-many-requests') {
                setErrorMessage('আপনি অনেকবার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।');
              } else {
                setErrorMessage('লিঙ্ক পাঠাতে সমস্যা হয়েছে।');
              }
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="w-full py-3 border border-indigo-500/30 hover:bg-indigo-500/10 disabled:opacity-50 transition-all text-indigo-600 font-bold text-xs rounded-xl cursor-pointer"
        >
          আবার লিঙ্ক পাঠান (Resend)
        </button>
        
        <button 
          onClick={() => {
            setViewState('auth');
            setIsLogin(true);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 transition-all text-slate-700 font-bold text-xs rounded-xl shadow-sm cursor-pointer"
        >
          লগইন পেজে ফিরে যান
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-y-auto font-sans">
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6 my-8">
        <div className="text-center space-y-2">
          <AppLogo size="lg" layout="vertical" variant="light" />
          <p className="text-indigo-800/80 text-xs font-medium tracking-wide">জমির খতিয়ান, দাগের হিসাব ও দলিল ডিজিটাল রেকর্ড বুক</p>
        </div>

        <div className="bg-white backdrop-blur-none border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl">
          {viewState === 'auth' && renderAuthForm()}
          {viewState === 'forgotPassword' && renderForgotPassword()}
          {viewState === 'emailVerification' && renderEmailVerification()}
        </div>
      </div>
    </div>
  );
}

const fs = require('fs');
const path = 'shgconnect-pwa/src/components/auth/LoginView.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Initialize enteredPin as empty string (no prefilled login code)
code = code.replace(
  "const [enteredPin, setEnteredPin] = useState<string>('1002');",
  "const [enteredPin, setEnteredPin] = useState<string>('');"
);

// 2. Fix Marathi font cut-out in upper tier buttons and stop prefilling on click
const oldTierGrid = `        {/* 4-Tier Segmented Control */}
        <div className="grid grid-cols-4 bg-stone-50/90 p-1 rounded-2xl border border-stone-200 gap-1">
          {TIERS.map((tier) => {
            const isSelected = selectedTierKey === tier.key;
            const Icon = tier.icon;
            return (
              <button
                key={tier.key}
                type="button"
                onClick={() => {
                  setSelectedTierKey(tier.key);
                  setEnteredPin(tier.pin);
                  setError('');
                }}
                className={\`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer \${
                  isSelected
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/60'
                }\`}
              >
                <Icon className={\`w-4 h-4 \${isSelected ? 'text-white' : 'text-stone-400'}\`} />
                <span className="text-[11px] font-bold leading-none truncate w-full text-center">
                  {isMr ? tier.labelMr : tier.labelEn}
                </span>
              </button>
            );
          })}
        </div>`;

const newTierGrid = `        {/* 4-Tier Segmented Control (Adequate line-height so Marathi matras never clip) */}
        <div className="grid grid-cols-4 bg-stone-50/90 p-1 rounded-2xl border border-stone-200 gap-1">
          {TIERS.map((tier) => {
            const isSelected = selectedTierKey === tier.key;
            const Icon = tier.icon;
            return (
              <button
                key={tier.key}
                type="button"
                onClick={() => {
                  setSelectedTierKey(tier.key);
                  setError('');
                }}
                className={\`py-2 sm:py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer overflow-visible min-h-[58px] \${
                  isSelected
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/60'
                }\`}
              >
                <Icon className={\`w-4 h-4 shrink-0 \${isSelected ? 'text-white' : 'text-stone-400'}\`} />
                <span className="text-[11px] font-bold leading-snug tracking-tight overflow-visible w-full text-center block pt-0.5 pb-0.5">
                  {isMr ? tier.labelMr : tier.labelEn}
                </span>
              </button>
            );
          })}
        </div>`;

code = code.replace(oldTierGrid.replace(/\r\n/g, '\n'), newTierGrid.replace(/\r\n/g, '\n'));
code = code.replace(oldTierGrid.replace(/\n/g, '\r\n'), newTierGrid.replace(/\n/g, '\r\n'));

// 3. Make digits 100% visible while typing (type="text", not type="password") with clean placeholder
const oldInputArea = `        {/* ── 4-Digit PIN Input (Full Width & Clean) ── */}
        <div className="space-y-1.5 pt-1">
          <div className="relative w-full">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={enteredPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\\D/g, '').slice(0, 4);
                setEnteredPin(val);
              }}
              placeholder="••••"
              className="w-full text-center tracking-[16px] font-mono text-2xl font-black py-2.5 px-4 bg-stone-50 hover:bg-stone-100/70 focus:bg-white border-2 border-stone-200 focus:border-[#14532D] rounded-2xl outline-none shadow-2xs text-stone-900 transition"
              aria-label="4-digit PIN"
            />
            {enteredPin.length > 0 && (
              <button
                type="button"
                onClick={() => { setEnteredPin(''); setError(''); setMatchedUser(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-500 hover:text-stone-800 flex items-center justify-center text-xs transition cursor-pointer"
                title={isMr ? 'पिन हटवा' : 'Clear'}
              >
                ✕
              </button>
            )}
          </div>

          {/* Minimalist User Verification Pill / Error */}
          <div className="min-h-[22px] flex items-center justify-center text-center">
            {matchedUser ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full animate-fadeIn shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{isMr ? (matchedUser.user.nameRegional || matchedUser.user.name) : matchedUser.user.name}</span>
                <span className="text-[10px] text-emerald-700 font-semibold opacity-90">
                  · {matchedUser.role === 'OFFICE_BEARER'
                    ? (isMr ? 'गट प्रमुख' : 'Lead')
                    : matchedUser.role === 'ANIMATOR' || matchedUser.role === 'OFFICER'
                    ? (isMr ? 'अधिकारी' : 'Officer')
                    : matchedUser.role === 'AUDITOR'
                    ? (isMr ? 'लेखापरीक्षक' : 'Auditor')
                    : (isMr ? 'सभासद' : 'Member')}
                </span>
              </div>
            ) : error ? (
              <span className="text-[11px] font-bold text-rose-600 animate-shake">
                {error}
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 font-medium">
                {isMr ? '४-अंकी पिन टाइप करा किंवा वरील भूमिकेवर टॅप करा' : 'Type 4-digit PIN or tap a role above'}
              </span>
            )}
          </div>
        </div>

        {/* ── Main Full-Width Sign-In Action Button ── */}
        <button
          type="button"
          onClick={() => {
            if (matchedUser) {
              executeLogin(matchedUser);
            } else {
              handleOneTapLogin(enteredPin || currentTier.pin);
            }
          }}
          className="w-full bg-[#14532D] hover:bg-emerald-900 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition cursor-pointer"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
          <span className="truncate">
            {matchedUser
              ? (isMr ? \`\${matchedUser.user.nameRegional || matchedUser.user.name} म्हणून प्रवेश करा\` : \`Sign In as \${matchedUser.user.name}\`)
              : (isMr ? currentTier.actionMr : currentTier.actionEn)}
          </span>
          <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
        </button>`;

const newInputArea = `        {/* ── 4-Digit PIN Input (Visible Numbers, No Prefill) ── */}
        <div className="space-y-1.5 pt-1">
          <div className="relative w-full">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoComplete="off"
              value={enteredPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\\D/g, '').slice(0, 4);
                setEnteredPin(val);
              }}
              placeholder="----"
              className="w-full text-center tracking-[16px] sm:tracking-[20px] font-mono text-2xl sm:text-3xl font-black py-2.5 px-4 bg-stone-50 hover:bg-stone-100/70 focus:bg-white border-2 border-stone-200 focus:border-[#14532D] rounded-2xl outline-none shadow-2xs text-stone-900 transition placeholder:text-stone-300 placeholder:tracking-[12px]"
              aria-label="4-digit PIN"
            />
            {enteredPin.length > 0 && (
              <button
                type="button"
                onClick={() => { setEnteredPin(''); setError(''); setMatchedUser(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-500 hover:text-stone-800 flex items-center justify-center text-xs transition cursor-pointer"
                title={isMr ? 'पिन हटवा' : 'Clear'}
              >
                ✕
              </button>
            )}
          </div>

          {/* Minimalist User Verification Pill / Error */}
          <div className="min-h-[22px] flex items-center justify-center text-center">
            {matchedUser ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full animate-fadeIn shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{isMr ? (matchedUser.user.nameRegional || matchedUser.user.name) : matchedUser.user.name}</span>
                <span className="text-[10px] text-emerald-700 font-semibold opacity-90">
                  · {matchedUser.role === 'OFFICE_BEARER'
                    ? (isMr ? 'गट प्रमुख' : 'Lead')
                    : matchedUser.role === 'ANIMATOR' || matchedUser.role === 'OFFICER'
                    ? (isMr ? 'अधिकारी' : 'Officer')
                    : matchedUser.role === 'AUDITOR'
                    ? (isMr ? 'लेखापरीक्षक' : 'Auditor')
                    : (isMr ? 'सभासद' : 'Member')}
                </span>
              </div>
            ) : error ? (
              <span className="text-[11px] font-bold text-rose-600 animate-shake">
                {error}
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 font-medium">
                {isMr ? 'तुमचा ४-अंकी सुरक्षा पिन प्रविष्ट करा' : 'Enter your 4-digit security PIN'}
              </span>
            )}
          </div>
        </div>

        {/* ── Main Full-Width Sign-In Action Button ── */}
        <button
          type="button"
          onClick={() => {
            if (matchedUser) {
              executeLogin(matchedUser);
            } else if (enteredPin.length === 4) {
              const match = findUserByCredentials(customPhone, enteredPin);
              if (match) {
                executeLogin(match);
              } else {
                setError(isMr ? 'अवैध पिन. कृपया ४-अंकी वैध पिन टाका.' : 'Invalid PIN.');
              }
            } else {
              setError(isMr ? 'कृपया ४-अंकी पिन प्रविष्ट करा' : 'Please enter 4-digit PIN');
            }
          }}
          className={\`w-full py-3.5 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow transition cursor-pointer \${
            matchedUser
              ? 'bg-[#14532D] hover:bg-emerald-900 active:scale-[0.98] text-white'
              : 'bg-emerald-800/90 hover:bg-emerald-800 text-white active:scale-[0.98]'
          }\`}
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
          <span className="truncate">
            {matchedUser
              ? (isMr ? \`\${matchedUser.user.nameRegional || matchedUser.user.name} म्हणून प्रवेश करा\` : \`Sign In as \${matchedUser.user.name}\`)
              : (isMr ? 'प्रवेश करा (Sign In)' : 'Sign In')}
          </span>
          <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
        </button>`;

code = code.replace(oldInputArea.replace(/\r\n/g, '\n'), newInputArea.replace(/\r\n/g, '\n'));
code = code.replace(oldInputArea.replace(/\n/g, '\r\n'), newInputArea.replace(/\n/g, '\r\n'));

fs.writeFileSync(path, code, 'utf8');
console.log('LoginView.tsx updated with visible digits, Marathi typography fix, and no prefilled PIN!');

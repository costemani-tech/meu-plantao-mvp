
const fs = require('fs');
const path = 'src/app/DashboardInteractive.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update EarningsPrivacyWrapper to use custom event
content = content.replace(
    'export function EarningsPrivacyWrapper({ total, isPro, onUpgradeClick }: { total: number, isPro: boolean, onUpgradeClick?: () => void }) {',
    'export function EarningsPrivacyWrapper({ total, isPro }: { total: number, isPro: boolean }) {'
);

const upgradeTrigger = `const onUpgradeClick = () => {
    window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
  };`;

content = content.replace(
    'if (!mounted) return <div style={{ height: 40 }} />;',
    `if (!mounted) return <div style={{ height: 40 }} />;
  ${upgradeTrigger}`
);

// 2. Ensure DashboardInteractive listens to the event
content = content.replace(
    /useEffect\(\(\) => \{[\s\S]*?if \(!isPro\) \{[\s\S]*?setShowProModal\('Onload'\);[\s\S]*?\}[\s\S]*?\}, \[isPro\]\);/,
    `useEffect(() => {
    if (!isPro) {
      setShowProModal('Onload');
    }
    
    const handleOpen = () => setShowProModal('Event');
    window.addEventListener('open-upgrade-modal', handleOpen);
    return () => window.removeEventListener('open-upgrade-modal', handleOpen);
  }, [isPro]);`
);

// 3. Fix the click in EarningsPrivacyWrapper redesign
content = content.replace(
    '<div \n          onClick={onUpgradeClick}',
    '<div \n          onClick={onUpgradeClick}'
);

// 4. Update DesbloquearGanhosBtn to also use the event (optional but cleaner)
// Actually, it has its own modal logic. I should probably remove it and use the global one?
// No, I'll just leave it for now or unify it.

fs.writeFileSync(path, content, 'utf8');
console.log('DashboardInteractive events added');

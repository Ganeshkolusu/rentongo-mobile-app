const fs = require('fs');
const path = require('path');

// Translation mappings for all files
const translations = {
  // Common translations used across all files
  common: {
    "t('common.error')": "'Error'",
    "t('common.success')": "'Success'",
    "t('common.ok')": "'OK'",
    "t('common.cancel')": "'Cancel'",
    "t('common.delete')": "'Delete'",
    "t('common.edit')": "'Edit'",
    "t('common.save')": "'Save'",
    "t('common.back')": "'Back'",
    "t('common.loading')": "'Loading'",
    "t('common.submit')": "'Submit'",
    "t('common.description')": "'Description'",
    "t('common.viewReviews')": "'Reviews'",
    "t('common.savingEllipsis')": "'Saving...'",
    "t('common.validationError')": "'Validation Error'",
    "t('common.permissionDenied')": "'Permission Denied'",
  }
};

// File-specific translations
const fileTranslations = {
  'HelpScreen.js': {
    ...translations.common,
    "t('account.callUs')": "'Call Us'",
    "t('account.callNumber')": "'1800-123-456'",
    "t('account.emailUs')": "'Email Us'",
    "t('account.emailSupport')": "'support@rentongo.com'",
    "t('account.liveChat')": "'Live Chat'",
    "t('common.comingSoon')": "'Coming Soon'",
    "t('account.chatFeatureSoon')": "'Chat feature will be available soon'",
    "t('account.phoneNotSupported')": "'Phone calling not supported'",
    "t('account.failedCall')": "'Failed to make call'",
    "t('account.supportRequest')": "'Support Request'",
    "t('account.emailNotSupported')": "'Email not supported'",
    "t('account.failedEmail')": "'Failed to send email'",
    "t('account.helpSupport')": "'Help & Support'",
    "t('account.frequentlyAskedQuestions')": "'Frequently Asked Questions'",
    "t('account.stillNeedHelp')": "'Still Need Help?'",
    "t('account.supportTeamAvailable')": "'Our support team is available 24/7 to assist you'",
    "t('account.faq1Question')": "'How do I book a vehicle?'",
    "t('account.faq1Answer')": "'Select a vehicle, choose dates, and confirm booking'",
    "t('account.faq2Question')": "'Can I cancel my booking?'",
    "t('account.faq2Answer')": "'Yes, cancel from My Bookings before pickup time'",
    "t('account.faq3Question')": "'What documents do I need?'",
    "t('account.faq3Answer')": "'Valid driver license and government ID required'",
    "t('account.faq4Question')": "'How do I contact the owner?'",
    "t('account.faq4Answer')": "'Use chat or call feature after booking confirmed'",
    "t('account.faq5Question')": "'What if vehicle has issues?'",
    "t('account.faq5Answer')": "'Report immediately via app support'",
    "t('account.faq6Question')": "'Can I extend my booking?'",
    "t('account.faq6Answer')": "'Contact owner through chat to request extension'",
    "t('account.faq7Question')": "'How is pricing calculated?'",
    "t('account.faq7Answer')": "'Based on vehicle type, duration, and distance'",
    "t('account.faq8Question')": "'Is insurance included?'",
    "t('account.faq8Answer')": "'Check vehicle details for insurance coverage'",
    "t('account.faq9Question')": "'Can I modify my booking?'",
    "t('account.faq9Answer')": "'Contact support for modification requests'",
    "t('account.faq10Question')": "'What payment methods accepted?'",
    "t('account.faq10Answer')": "'We accept all major cards and digital wallets'",
  },
  // Add more files...
};

function processFile(filePath, mappings) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove import statement
    const importRemoved = content.replace(
      /import\s+\{\s*useTranslation\s*\}\s+from\s+['"]react-i18next['"];\s*\n/g,
      ''
    );
    if (importRemoved !== content) {
      content = importRemoved;
      modified = true;
    }

    // Remove const { t } = useTranslation();
    const constRemoved = content.replace(
      /\s*const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);\s*\n/g,
      '\n'
    );
    if (constRemoved !== content) {
      content = constRemoved;
      modified = true;
    }

    // Replace all t() calls
    Object.entries(mappings).forEach(([oldText, newText]) => {
      const replaced = content.replace(new RegExp(oldText.replace(/[()]/g, '\\$&'), 'g'), newText);
      if (replaced !== content) {
        content = replaced;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      // console.log(`✓ Updated: ${path.basename(filePath)}`);
      return true;
    } else {
      // console.log(`- No changes: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
const screensDir = path.join(__dirname, 'src', 'screens');
const files = Object.keys(fileTranslations);
let processed = 0;

files.forEach(filename => {
  const filePath = path.join(screensDir, filename);
  if (processFile(filePath, fileTranslations[filename])) {
    processed++;
  }
});
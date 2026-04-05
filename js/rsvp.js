/* ============================================================
   rsvp.js — RSVP form handling + Google Apps Script submission
   ============================================================
   SETUP: Replace APPS_SCRIPT_URL with your deployed Web App URL
   See backend/code.gs for instructions
   ============================================================ */

const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

document.addEventListener('DOMContentLoaded', () => {

  // ── Attendance cards (Day 1 / Day 2) ────────────────────
  document.querySelectorAll('.attendance-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const checkbox = card.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = card.classList.contains('selected');
    });
  });

  // ── Dietary chips ────────────────────────────────────────
  document.querySelectorAll('.chip[data-value]').forEach(chip => {
    chip.addEventListener('click', () => {
      // "None" chip clears others
      if (chip.dataset.value === 'none') {
        document.querySelectorAll('.chip[data-value]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      } else {
        document.querySelector('.chip[data-value="none"]')?.classList.remove('selected');
        chip.classList.toggle('selected');
      }
    });
  });

  // ── Guest counter ────────────────────────────────────────
  const guestInput   = document.getElementById('guests');
  const decreaseBtn  = document.getElementById('guests-decrease');
  const increaseBtn  = document.getElementById('guests-increase');

  if (guestInput && decreaseBtn && increaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      const val = parseInt(guestInput.value, 10);
      if (val > 1) guestInput.value = val - 1;
    });
    increaseBtn.addEventListener('click', () => {
      const val = parseInt(guestInput.value, 10);
      if (val < 10) guestInput.value = val + 1;
    });
  }

  // ── Form submission ──────────────────────────────────────
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect attendance
    const day1 = document.querySelector('.attendance-card[data-day="1"]')?.classList.contains('selected');
    const day2 = document.querySelector('.attendance-card[data-day="2"]')?.classList.contains('selected');

    if (!day1 && !day2) {
      showToast('Please select at least one day you will attend.', 'error');
      return;
    }

    // Collect dietary selections
    const dietarySelected = [];
    document.querySelectorAll('.chip[data-value].selected').forEach(chip => {
      dietarySelected.push(chip.dataset.value);
    });

    // Collect dietary "other" text
    const dietaryOther = document.getElementById('dietary-other')?.value?.trim() || '';

    // Collect guest names
    const guestNames = [];
    form.querySelectorAll('[data-index]').forEach(inp => {
      const val = inp.value.trim();
      if (val) guestNames.push(val);
    });

    const payload = {
      name:          form.querySelector('#name')?.value?.trim()  || '',
      email:         form.querySelector('#email')?.value?.trim() || '',
      phone:         form.querySelector('#phone')?.value?.trim() || '',
      day1:          day1 ? 'Yes' : 'No',
      day2:          day2 ? 'Yes' : 'No',
      guests:        form.querySelector('#guests')?.value        || '1',
      guest_names:   guestNames.join(' | '),
      dietary:       dietarySelected.length ? dietarySelected.join(', ') : 'None',
      dietary_other: dietaryOther,
      song:          form.querySelector('#song')?.value?.trim()  || '',
      notes:         form.querySelector('#notes')?.value?.trim() || '',
    };

    if (!payload.name || !payload.email || !payload.phone) {
      showToast('Please fill in your name, email and phone number.', 'error');
      return;
    }

    if (!guestNames.length) {
      showToast('Please enter the full name of each guest.', 'error');
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // If no URL configured, simulate success for development
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
      await new Promise(r => setTimeout(r, 1000));
      showSuccess(form, payload.name.split(' ')[0]);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      return;
    }

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        showSuccess(form, payload.name.split(' ')[0]);
      } else {
        throw new Error('Server returned an error');
      }
    } catch (err) {
      console.error(err);
      showToast('Something went wrong. Please try again or contact us directly.', 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

});

function showSuccess(form, firstName) {
  const successMsg = document.getElementById('rsvp-success');
  if (successMsg) {
    form.style.display = 'none';
    successMsg.style.display = 'block';
    successMsg.querySelector('.success-name').textContent = firstName || 'dear guest';
  } else {
    showToast(`Thank you, ${firstName}! We can't wait to celebrate with you.`, 'success');
    form.reset();
    document.querySelectorAll('.attendance-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.chip[data-value]').forEach(c => c.classList.remove('selected'));
  }
}

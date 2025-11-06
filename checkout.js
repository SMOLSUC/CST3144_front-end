const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    const cart = ref(JSON.parse(localStorage.getItem('cart') || '[]'));
    const subtotal = computed(() => cart.value.reduce((s, i) => s + i.price, 0));
    const order = ref({ name: '', email: '', phonenum: '', cardNumber: '', expiry: '', cvv: '' });
    const submitted = ref(false);
    const toast = ref('');

  async function submitOrder() {
    try {
      const newOrder = {
        name: order.value.name,
        email: order.value.email,
        phonenum: order.value.phonenum,
        total: subtotal.value,
        items: cart.value,
        date: new Date().toISOString()
      };

      // 1️⃣ Save the order
      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (!response.ok) throw new Error('Order failed');

      // 2️⃣ Decrement each lesson’s space by 1
      for (const item of cart.value) {
        await fetch(`http://localhost:3000/api/lessons/${item.id}/decrement`, {
          method: 'PUT'
        });
      }

      // 3️⃣ Clear cart + show success
      localStorage.removeItem('cart');
      submitted.value = true;
      showToast('Payment successful!');

    } catch (err) {
      console.error('Error submitting order:', err);
      showToast('Payment failed');
    }
  }

  const isFormValid = computed(() => {
  const nameValid = order.value.name.trim().length > 1;
  const phoneValid = /^[0-9+\-\s]{7,15}$/.test(order.value.phonenum);
  return nameValid && phoneValid;
  });


    function goBack() {
      window.location.href = 'index.html';
    }

    function goHome() {
      window.location.href = 'index.html';
    }

    function showToast(msg) {
      toast.value = msg;
      setTimeout(() => (toast.value = ''), 1800);
    }

    return { order, cart, subtotal, submitted, submitOrder, goBack, goHome, toast, isFormValid  };
  }
}).mount('#app');

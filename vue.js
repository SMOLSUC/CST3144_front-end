const { createApp, ref, reactive, computed, onMounted } = Vue;
createApp({
  setup() {
    const search = ref('');
    const categoryFilter = ref('');
    const levelFilter = ref('');
    const openCart = ref(false);
    const previewCourse = ref(null);
    const toast = ref('');
    const courses = ref([]);
    const cart = ref(JSON.parse(localStorage.getItem('cart')||'[]'));

    const sortBy = ref('');
    const sortOrder = ref('asc');

    const fetchCourses = async () => {
      try {
        const res = await fetch('https://cst3114-back-end.onrender.com/api/lessons');
        const data = await res.json();
        courses.value = data.map(lesson => ({
          id: lesson._id,
          title: lesson.topic,
          subject: lesson.subject || lesson.topic,
          subtitle: `Location: ${lesson.location}`,
          price: lesson.price,
          duration: lesson.duration,
          level: lesson.level,
          category: 'General',
          image: lesson.image, 
          preview: lesson.preview,
          projectOutcome: lesson.preview,
          spaces: lesson.space,
          lessons: Array.from({length: lesson.space}, (_, i) => ({title: `Lesson ${i+1}`, access: false})),
        }));
      } catch(err){ console.error(err); }
    };

    onMounted(fetchCourses);

    const categories = computed(()=>[...new Set(courses.value.map(c=>c.category))]);
    const featured = computed(()=>courses.value[0]||{title:'',price:0,image:''});
    const filteredCourses = computed(()=>{
      // 1. Apply Filtering Logic
      let result = courses.value.filter(c=>{
        const q=(c.title+' '+c.subtitle).toLowerCase();
        return (!search.value||q.includes(search.value.toLowerCase()))
          &&(!categoryFilter.value||c.category===categoryFilter.value)
          &&(!levelFilter.value||c.level===levelFilter.value);
      });
      
      // 2. Apply Sorting Logic
      if (sortBy.value) {
          result.sort((a, b) => {
              let valA = a[sortBy.value];
              let valB = b[sortBy.value];
              
              // Handle string comparisons (Subject/Location)
              if (typeof valA === 'string') {
                  valA = valA.toLowerCase();
                  valB = valB.toLowerCase();
              }
              
              let comparison = 0;
              if (valA > valB) {
                  comparison = 1;
              } else if (valA < valB) {
                  comparison = -1;
              }
              
              // Apply ascending/descending order
              // Multiply comparison by -1 to reverse the order if 'desc' is selected
              return sortOrder.value === 'desc' ? comparison * -1 : comparison;
          });
      }
      
      return result;
    });
    const cartCount = computed(()=>cart.value.length);
    const subtotal = computed(()=>cart.value.reduce((s,i)=>s+i.price,0));

    function addToCart(course) {
      const existing = cart.value.find(i => i.id === course.id);
      if (existing) {
        showToast('Already in cart');
        return;
      }

      // 1️⃣ Add to cart
      cart.value.push(course);
      localStorage.setItem('cart', JSON.stringify(cart.value));

      // 2️⃣ Temporarily decrease space (frontend only)
      const targetCourse = courses.value.find(c => c.id === course.id);
      if (targetCourse && targetCourse.spaces > 0) {
        targetCourse.spaces -= 1;
      }

      // 3️⃣ Show toast
      showToast('Added to cart');
    }

    
    function removeFromCart(index) {
      const removed = cart.value.splice(index, 1)[0];
      localStorage.setItem('cart', JSON.stringify(cart.value));

      const targetCourse = courses.value.find(c => c.id === removed.id);
      if (targetCourse) targetCourse.spaces += 1;
    }

    function checkout(){ localStorage.setItem('cart', JSON.stringify(cart.value.map(i => ({ id: i.id, title: i.title, price: i.price, image:i.image })))); window.location.href = 'checkout.html'; }
    function preview(c){previewCourse.value=c;}
    function showToast(msg){toast.value=msg; setTimeout(()=>toast.value='',1800);}

    return {search,categoryFilter,levelFilter,categories,filteredCourses,featured,cart,cartCount,subtotal,addToCart,removeFromCart,checkout,openCart,previewCourse,preview,toast, sortBy, sortOrder};
  }
}).mount('#app');
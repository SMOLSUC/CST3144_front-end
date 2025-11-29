const { createApp, ref, reactive, computed, onMounted } = Vue;
createApp({
  setup() {
    const BACKEND_URL = 'https://cst3114-back-end.onrender.com';
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
          image: `${BACKEND_URL}/${lesson.image}`,
          preview: lesson.preview,
          projectOutcome: lesson.preview,
          spaces: lesson.space,
          lessons: Array.from({length: lesson.space}, (_, i) => ({title: `Lesson ${i+1}`, access: false})),
        }));
      } catch(err){ console.error(err); }
    };

    onMounted(fetchCourses);

    const categories = computed(()=>[...new Set(courses.value.map(c=>c.category))]);
    const featured = computed(()=>courses.value[0]||{title:'',price:0,image:'',subject:''});
    const filteredCourses = computed(()=>{
      let result = courses.value.filter(c => {
              const searchableText = (c.title + ' ' + c.subtitle + ' ' + c.subject).toLowerCase();
              
              const matchesSearch = !search.value || searchableText.includes(search.value.toLowerCase());
              const matchesCategory = !categoryFilter.value || c.category === categoryFilter.value;
              const matchesLevel = !levelFilter.value || c.level === levelFilter.value;

              return matchesSearch && matchesCategory && matchesLevel;
          });
          
          if (sortBy.value) {
              result.sort((a, b) => {
                  const valA = a[sortBy.value];
                  const valB = b[sortBy.value];
                  
                  let comparison = 0;

                  if (typeof valA === 'string') {
                      comparison = String(valA).localeCompare(String(valB));
                  } else {
                      comparison = valA - valB;
                  }
                  
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

      //Add to cart
      cart.value.push(course);
      localStorage.setItem('cart', JSON.stringify(cart.value));

      //Temporarily decrease space (frontend only)
      const targetCourse = courses.value.find(c => c.id === course.id);
      if (targetCourse && targetCourse.spaces > 0) {
        targetCourse.spaces -= 1;
      }
      //Show toast
      showToast('Added to cart');
    }

    
    function removeFromCart(index) {
      const removed = cart.value.splice(index, 1)[0];
      localStorage.setItem('cart', JSON.stringify(cart.value));

      const targetCourse = courses.value.find(c => c.id === removed.id);
      if (targetCourse) targetCourse.spaces += 1;
    }

    function checkout(){ localStorage.setItem('cart', JSON.stringify(cart.value.map(i => ({ id: i.id, title: i.title, subject: i.subject, price: i.price, image:i.image })))); window.location.href = 'checkout.html'; }
    function preview(c){previewCourse.value=c;}
    function showToast(msg){toast.value=msg; setTimeout(()=>toast.value='',1800);}

    return {search,categoryFilter,levelFilter,categories,filteredCourses,featured,cart,cartCount,subtotal,addToCart,removeFromCart,checkout,openCart,previewCourse,preview,toast, sortBy, sortOrder};
  }
}).mount('#app');
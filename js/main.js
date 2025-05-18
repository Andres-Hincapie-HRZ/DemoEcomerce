document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let products = [];
    let cart = [];
    let categories = [];
    
    // Elementos del DOM
    const productsGrid = document.querySelector('.products-grid');
    const categoryFilters = document.querySelector('.category-filters');
    const cartIcon = document.querySelector('.cart-icon');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.overlay');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCount = document.querySelector('.cart-count');
    const totalAmount = document.querySelector('.total-amount');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    console.log("DOM cargado, inicializando tienda"); // Debug
    
    // Intentar cargar el carrito desde localStorage
    try {
        const savedCart = localStorage.getItem('cart');
        console.log("Carrito guardado en localStorage:", savedCart); // Debug
        cart = savedCart ? JSON.parse(savedCart) : [];
        console.log("Carrito inicializado:", cart); // Debug
    } catch (error) {
        console.error("Error al cargar el carrito desde localStorage:", error);
        cart = [];
    }
    
    // Cargar productos desde JSON con manejo de errores mejorado
    async function loadProducts() {
        try {
            console.log("Intentando cargar productos desde js/products.json"); // Debug
            const response = await fetch('js/products.json');
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Datos recibidos:", data); // Debug
            
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("Formato de datos inválido o array vacío");
            }
            
            products = data;
            console.log("Productos cargados:", products.length); // Debug
            
            // Extraer categorías únicas
            categories = [...new Set(products.map(product => product.category))];
            console.log("Categorías:", categories); // Debug
            
            // Renderizar categorías y productos
            renderCategories();
            renderProducts(products);
            
            // Actualizar carrito
            updateCartUI();
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            productsGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar productos: ${error.message}</p>
                    <button onclick="window.location.reload()" class="retry-btn">
                        <i class="fas fa-redo"></i> Intentar de nuevo
                    </button>
                </div>
            `;
        }
    }
    
    // Iniciar carga de productos
    loadProducts();
    
    // Crear modal de detalles del producto
    const productModal = document.createElement('div');
    productModal.className = 'product-modal';
    productModal.innerHTML = `
        <div class="product-modal-content">
            <button class="close-modal"><i class="fas fa-times"></i></button>
            <div class="product-modal-details">
                <!-- Los detalles del producto se cargarán aquí dinámicamente -->
            </div>
        </div>
    `;
    document.body.appendChild(productModal);
    
    // Agregar evento para cerrar el modal
    const closeModalBtn = document.querySelector('.close-modal');
    closeModalBtn.addEventListener('click', closeProductModal);
    
    // Función para renderizar categorías
    function renderCategories() {
        let html = `<button class="category-btn active" data-category="all">Todos</button>`;
        
        categories.forEach(category => {
            html += `<button class="category-btn" data-category="${category}">${category}</button>`;
        });
        
        categoryFilters.innerHTML = html;
        
        // Agregar event listeners a los botones de categoría
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remover clase active de todos los botones
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                
                // Agregar clase active al botón clickeado
                this.classList.add('active');
                
                const selectedCategory = this.dataset.category;
                
                if (selectedCategory === 'all') {
                    renderProducts(products);
                } else {
                    const filteredProducts = products.filter(product => product.category === selectedCategory);
                    renderProducts(filteredProducts);
                }
            });
        });
    }
    
    // Función para renderizar productos
    function renderProducts(productsToRender) {
        console.log("Renderizando productos:", productsToRender.length); // Debug
        
        let html = '';
        
        if (!productsToRender || productsToRender.length === 0) {
            html = '<p class="no-products">No hay productos disponibles</p>';
            productsGrid.innerHTML = html;
            return;
        }
        
        productsToRender.forEach(product => {
            html += `
                <div class="product-card" data-id="${product.id}">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-price">$${product.price.toFixed(2)}</p>
                        <p class="product-description">${product.description}</p>
                        <div class="product-actions">
                            <div class="top-buttons">
                                <button class="add-to-cart" data-id="${product.id}">
                                    <i class="fas fa-shopping-cart"></i> Agregar
                                </button>
                                <button class="view-details" data-id="${product.id}">
                                    <i class="fas fa-eye"></i> Ver detalles
                                </button>
                            </div>
                            <button class="whatsapp-btn" data-id="${product.id}">
                                <i class="fab fa-whatsapp"></i> Comprar ahora
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        productsGrid.innerHTML = html;
        console.log("HTML de productos renderizado"); // Debug
        
        // Agregar event listeners a los botones
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        console.log("Botones de agregar al carrito encontrados:", addToCartButtons.length); // Debug
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function() {
                console.log("Botón 'Agregar al carrito' clickeado"); // Debug
                const productId = parseInt(this.dataset.id);
                console.log("ID del producto:", productId); // Debug
                addToCartById(productId);
            });
        });
        
        const viewDetailsButtons = document.querySelectorAll('.view-details');
        viewDetailsButtons.forEach(button => {
            button.addEventListener('click', showProductDetails);
        });
        
        const whatsappButtons = document.querySelectorAll('.whatsapp-btn');
        whatsappButtons.forEach(button => {
            button.addEventListener('click', buyViaWhatsapp);
        });
    }
    
    // Función para mostrar detalles del producto
    function showProductDetails() {
        const productId = parseInt(this.dataset.id);
        const product = findProductById(productId);
        
        if (!product) {
            console.error("Producto no encontrado para mostrar detalles:", productId);
            return;
        }
        
        const modalDetails = document.querySelector('.product-modal-details');
        
        modalDetails.innerHTML = `
            <div class="modal-product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="modal-product-info">
                <h2>${product.name}</h2>
                <p class="modal-product-price">$${product.price.toFixed(2)}</p>
                <div class="modal-product-description">
                    <h3>Descripción:</h3>
                    <p>${product.description}</p>
                </div>
                <div class="modal-product-category">
                    <h3>Categoría:</h3>
                    <p>${product.category}</p>
                </div>
                <div class="modal-product-actions">
                    <button class="modal-add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Agregar al carrito
                    </button>
                    <button class="modal-whatsapp" data-id="${product.id}">
                        <i class="fab fa-whatsapp"></i> Comprar por WhatsApp
                    </button>
                </div>
            </div>
        `;
        
        // Añadir eventos a los botones del modal
        const modalAddToCartBtn = modalDetails.querySelector('.modal-add-to-cart');
        modalAddToCartBtn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            addToCartById(productId);
            closeProductModal();
        });
        
        const modalWhatsappBtn = modalDetails.querySelector('.modal-whatsapp');
        modalWhatsappBtn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            buyViaWhatsappById(productId);
            closeProductModal();
        });
        
        // Mostrar modal
        productModal.classList.add('show');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Función para cerrar modal de producto
    function closeProductModal() {
        productModal.classList.remove('show');
        overlay.classList.remove('active');
        
        // Si el carrito no está abierto, restaurar el overflow
        if (!cartSidebar.classList.contains('open')) {
            document.body.style.overflow = '';
        }
    }
    
    // Función auxiliar para encontrar un producto por ID
    function findProductById(productId) {
        console.log("Buscando producto con ID:", productId); // Debug
        console.log("Número de productos disponibles:", products.length); // Debug
        
        if (!products || products.length === 0) {
            console.error("Array de productos vacío o no definido");
            return null;
        }
        
        const product = products.find(p => p.id === productId);
        console.log("Producto encontrado:", product ? product.name : "No encontrado"); // Debug
        return product;
    }
    
    // Función para agregar al carrito por ID
    function addToCartById(productId) {
        console.log("Intentando agregar al carrito producto ID:", productId); // Debug
        
        if (!productId || typeof productId !== 'number') {
            console.error("ID de producto inválido:", productId);
            return;
        }
        
        const product = findProductById(productId);
        
        if (!product) {
            console.error("Producto no encontrado para agregar al carrito:", productId);
            return;
        }
        
        // Validar que el producto tenga todos los campos necesarios
        if (!product.name || !product.price || typeof product.price !== 'number') {
            console.error("Producto con datos inválidos:", product);
            return;
        }
        
        console.log("Agregando al carrito:", product.name); // Debug
        
        // Verificar que cart sea un array
        if (!Array.isArray(cart)) {
            console.error("Cart no es un array, inicializando...");
            cart = [];
        }
        
        // Verificar si el producto ya está en el carrito
        const existingItemIndex = cart.findIndex(item => item && item.id === productId);
        
        if (existingItemIndex > -1) {
            // Incrementar cantidad si ya existe
            if (typeof cart[existingItemIndex].quantity === 'number') {
                cart[existingItemIndex].quantity += 1;
                console.log("Incrementada cantidad de producto existente. Nueva cantidad:", cart[existingItemIndex].quantity); // Debug
            } else {
                cart[existingItemIndex].quantity = 1;
                console.log("Cantidad reiniciada a 1 por ser inválida"); // Debug
            }
        } else {
            // Agregar nuevo item al carrito
            const newItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || '',
                quantity: 1
            };
            cart.push(newItem);
            console.log("Nuevo producto agregado al carrito:", newItem); // Debug
        }
        
        // Guardar carrito en localStorage
        saveCart();
        
        // Actualizar UI
        updateCartUI();
        
        // Mostrar mensaje de éxito
        showNotification(`${product.name} agregado al carrito`, 'success');
        
        // Abrir el carrito
        openCart();
    }
    
    // Función para agregar al carrito (wrapper de addToCartById)
    function addToCart() {
        const productId = parseInt(this.dataset.id);
        console.log("addToCart llamado con ID:", productId); // Debug
        addToCartById(productId);
    }
    
    // Función para comprar vía WhatsApp por ID
    function buyViaWhatsappById(productId) {
        const product = findProductById(productId);
        
        if (!product) {
            console.error("Producto no encontrado para WhatsApp:", productId);
            return;
        }
        
        // Número de WhatsApp actualizado
        const phoneNumber = '+573167699072';
        
        // Mensaje
        const message = `Hola, estoy interesado en comprar: ${product.name} - $${product.price.toFixed(2)}`;
        
        // URL de WhatsApp
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        // Abrir WhatsApp en una nueva pestaña
        window.open(whatsappUrl, '_blank');
    }
    
    // Función para comprar vía WhatsApp
    function buyViaWhatsapp() {
        const productId = parseInt(this.dataset.id);
        buyViaWhatsappById(productId);
    }
    
    // Función para actualizar la UI del carrito
    function updateCartUI() {
        console.log("Actualizando UI del carrito, items:", cart.length); // Debug
        console.log("Contenido actual del carrito:", cart); // Debug
        
        // Verificar que cart sea un array válido
        if (!Array.isArray(cart)) {
            console.error("Error: cart no es un array válido");
            cart = [];
        }
        
        // Actualizar contador de items
        const totalItems = cart.reduce((total, item) => total + (item?.quantity || 0), 0);
        cartCount.textContent = totalItems;
        console.log("Total de items en carrito:", totalItems); // Debug
        
        // Actualizar items en el carrito
        let html = '';
        
        if (cart.length === 0) {
            html = '<p class="empty-cart">Tu carrito está vacío</p>';
            checkoutBtn.disabled = true;
            console.log("Carrito vacío, mostrando mensaje"); // Debug
        } else {
            // Agregar botón de vaciar carrito
            html += `
                <div class="cart-actions">
                    <button class="clear-cart-btn">
                        <i class="fas fa-trash"></i> Vaciar Carrito
                    </button>
                </div>
            `;
            
            cart.forEach(item => {
                if (!item || typeof item !== 'object' || !item.id) {
                    console.error("Item inválido en el carrito:", item);
                    return;
                }
                
                console.log("Renderizando item:", item); // Debug
                const itemPrice = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
                
                html += `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-image">
                            <img src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.name || 'Producto'}">
                        </div>
                        <div class="cart-item-details">
                            <h4 class="cart-item-title">${item.name || 'Producto sin nombre'}</h4>
                            <p class="cart-item-price">$${itemPrice}</p>
                            <div class="cart-item-quantity">
                                <button class="quantity-btn decrease" data-id="${item.id}">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" class="quantity-input" value="${item.quantity || 1}" min="1" data-id="${item.id}">
                                <button class="quantity-btn increase" data-id="${item.id}">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <button class="remove-item" data-id="${item.id}" title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });
            
            checkoutBtn.disabled = false;
        }
        
        cartItemsContainer.innerHTML = html;
        console.log("HTML del carrito actualizado"); // Debug
        
        // Calcular total con verificación de valores numéricos
        const total = cart.reduce((sum, item) => {
            const price = typeof item?.price === 'number' ? item.price : 0;
            const quantity = typeof item?.quantity === 'number' ? item.quantity : 0;
            return sum + (price * quantity);
        }, 0);
        
        totalAmount.textContent = `$${total.toFixed(2)}`;
        console.log("Total del carrito:", total.toFixed(2)); // Debug
        
        // Agregar event listeners a los botones del carrito
        const decreaseButtons = document.querySelectorAll('.decrease');
        const increaseButtons = document.querySelectorAll('.increase');
        const removeButtons = document.querySelectorAll('.remove-item');
        const quantityInputs = document.querySelectorAll('.quantity-input');
        const clearCartBtn = document.querySelector('.clear-cart-btn');
        
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', clearCart);
        }
        
        decreaseButtons.forEach(button => {
            button.addEventListener('click', decreaseQuantity);
        });
        
        increaseButtons.forEach(button => {
            button.addEventListener('click', increaseQuantity);
        });
        
        removeButtons.forEach(button => {
            button.addEventListener('click', removeItem);
        });
        
        quantityInputs.forEach(input => {
            input.addEventListener('change', updateQuantity);
        });
    }
    
    // Función para vaciar el carrito
    function clearCart() {
        if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
            cart = [];
            saveCart();
            updateCartUI();
            showNotification('Carrito vaciado correctamente', 'success');
        }
    }
    
    // Función para eliminar item
    function removeItem() {
        const productId = parseInt(this.dataset.id);
        if (!productId) return;
        
        const itemIndex = cart.findIndex(item => item && item.id === productId);
        
        if (itemIndex > -1) {
            const removedItem = cart[itemIndex];
            cart.splice(itemIndex, 1);
            saveCart();
            updateCartUI();
            
            showNotification(`${removedItem.name || 'Producto'} eliminado del carrito`, 'success');
        }
    }
    
    // Función para disminuir cantidad
    function decreaseQuantity() {
        const productId = parseInt(this.dataset.id);
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            if (cart[itemIndex].quantity > 1) {
                cart[itemIndex].quantity -= 1;
            } else {
                cart.splice(itemIndex, 1);
            }
            
            saveCart();
            updateCartUI();
        }
    }
    
    // Función para aumentar cantidad
    function increaseQuantity() {
        const productId = parseInt(this.dataset.id);
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            cart[itemIndex].quantity += 1;
            saveCart();
            updateCartUI();
        }
    }
    
    // Función para actualizar cantidad desde input
    function updateQuantity() {
        const productId = parseInt(this.dataset.id);
        const newQuantity = parseInt(this.value);
        
        if (isNaN(newQuantity) || newQuantity < 1) {
            this.value = 1;
            return;
        }
        
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            cart[itemIndex].quantity = newQuantity;
            saveCart();
            updateCartUI();
        }
    }
    
    // Función para guardar carrito en localStorage
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log("Carrito guardado en localStorage:", cart.length, "items"); // Debug
    }
    
    // Función para mostrar notificación
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <p>${message}</p>
            <button class="close-notification">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar notificación
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Ocultar notificación después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
        
        // Cerrar notificación al hacer clic en el botón
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        });
    }
    
    // Abrir carrito
    function openCart() {
        cartSidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Cerrar carrito
    function closeCart() {
        cartSidebar.classList.remove('open');
        overlay.classList.remove('active');
        
        // Si el modal de producto no está abierto, restaurar el overflow
        if (!productModal.classList.contains('show')) {
            document.body.style.overflow = '';
        }
    }
    
    // Event listeners para abrir/cerrar carrito
    cartIcon.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    overlay.addEventListener('click', function() {
        closeCart();
        closeProductModal();
    });
    
    // Event listener para finalizar compra
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) return;
        
        // Aquí puedes implementar la lógica para finalizar la compra
        // Por ejemplo, redirigir a una página de pago o enviar los datos a un servidor
        
        alert('¡Gracias por tu compra! En breve recibirás un correo con los detalles.');
        
        // Limpiar carrito
        cart = [];
        saveCart();
        updateCartUI();
        closeCart();
    });
    
    // Agregar estilos para notificaciones y modal
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            background-color: white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            transform: translateY(100px);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
            z-index: 1001;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .notification.success {
            border-left: 4px solid var(--success-color);
        }
        
        .notification.error {
            border-left: 4px solid var(--error-color);
        }
        
        .close-notification {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            margin-left: 10px;
        }
        
        .empty-cart {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        
        .top-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .add-to-cart, .view-details {
            flex: 1;
        }
        
        .whatsapp-btn {
            width: 100%;
        }
        
        .no-products {
            text-align: center;
            padding: 20px;
            font-size: 18px;
            color: #666;
        }
        
        /* Estilos para el modal de producto */
        .product-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s;
        }
        
        .product-modal.show {
            opacity: 1;
            visibility: visible;
        }
        
        .product-modal-content {
            background-color: white;
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow-y: auto;
        }
        
        .close-modal {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            z-index: 2;
        }
        
        .product-modal-details {
            display: flex;
            flex-wrap: wrap;
            padding: 30px;
        }
        
        .modal-product-image {
            flex: 1;
            min-width: 300px;
            margin-right: 30px;
            margin-bottom: 20px;
        }
        
        .modal-product-image img {
            width: 100%;
            height: auto;
            border-radius: 4px;
            object-fit: cover;
        }
        
        .modal-product-info {
            flex: 1;
            min-width: 300px;
        }
        
        .modal-product-info h2 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .modal-product-price {
            font-size: 28px;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 20px;
        }
        
        .modal-product-description,
        .modal-product-category {
            margin-bottom: 20px;
        }
        
        .modal-product-description h3,
        .modal-product-category h3 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        
        .modal-product-actions {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }
        
        .modal-add-to-cart,
        .modal-whatsapp {
            padding: 12px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .modal-add-to-cart {
            background-color: var(--primary-color);
            color: white;
        }
        
        .modal-whatsapp {
            background-color: #25D366;
            color: white;
        }
        
        @media (max-width: 768px) {
            .product-modal-details {
                flex-direction: column;
            }
            
            .modal-product-image {
                margin-right: 0;
            }
            
            .modal-product-actions {
                flex-direction: column;
            }
        }
    `;
    
    document.head.appendChild(style);
}); 
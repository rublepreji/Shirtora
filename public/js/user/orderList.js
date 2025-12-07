let currentPage = 1;

async function loadOrders(page = 1, search = "") {
    currentPage = page;

    const res = await fetch(`/ordersData?page=${page}&search=${search}`);
    const data = await res.json();

    if (data.success) {
        renderOrders(data.orders);
        renderPagination(data.currentPage, data.totalPages);
    }
}

function renderOrders(orders) {
    const container = document.getElementById("ordersContainer");
    container.innerHTML = "";

    if (orders.length === 0) {
        container.innerHTML = `<p class="text-gray-600 text-center">No orders found</p>`;
        return;
    }

    orders.forEach(order => {
        container.innerHTML += `
            <div class="card-border rounded p-4 mb-6">
                <div class="flex justify-between text-sm mb-3">
                    <span>Order ID: <b>${order.orderId}</b></span>
                    <span>${new Date(order.createdAt).toDateString()}</span>
                </div>

                <div class="flex gap-4">
                    <img src="${order.items[0].productId.productImage[0]}" 
                         class="w-20 h-20 rounded object-cover"/>

                    <div class="flex-1">
                        <p class="font-semibold">${order.items[0].productId.productName}</p>
                        <p class="text-xs text-gray-600">₹${order.totalAmount}</p>
                        <p class="mt-1 text-sm font-medium text-orange-600">${order.status}</p>
                    </div>

                    <a href="/orderdetails/${order.orderId}">
                        <button class="px-3 py-1 text-sm border rounded bg-blue-200 text-blue-700">
                            View
                        </button>
                    </a>
                </div>
            </div>
        `;
    });
}

function renderPagination(current, total) {
    const wrapper = document.getElementById("paginationWrapper");
    wrapper.innerHTML = "";

    if (current > 1) {
        wrapper.innerHTML += `
            <button class="px-3 py-1 bg-gray-200 rounded" 
                    onclick="loadOrders(${current - 1}, searchInput.value)">
                Prev
            </button>`;
    }

    for (let i = 1; i <= total; i++) {
        wrapper.innerHTML += `
            <button class="px-3 py-1 rounded ${current === i ? 'bg-black text-white' : 'bg-gray-200'}" 
                    onclick="loadOrders(${i}, searchInput.value)">
                ${i}
            </button>`;
    }

    if (current < total) {
        wrapper.innerHTML += `
            <button class="px-3 py-1 bg-gray-200 rounded" 
                    onclick="loadOrders(${current + 1}, searchInput.value)">
                Next
            </button>`;
    }
}

const searchInput = document.getElementById("search");
let debounceTimer;

searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        loadOrders(1, searchInput.value.trim());
    }, 400);
});

loadOrders(1);
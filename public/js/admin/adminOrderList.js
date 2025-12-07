const statusFilter = document.getElementById("statusFilter");

statusFilter.addEventListener("change", () => {
    loadOrders(1, searchInput.value.trim(), statusFilter.value);
});



const searchInput = document.getElementById('search');
let currentPage = 1;

// Load Orders (API Fetch)
async function loadOrders(page = 1, search = "", status = "") {
    currentPage = page;

    const res = await fetch(`/admin/dataForOrderList?page=${page}&search=${search}&status=${status}`);
    const data = await res.json();

    if (data.success) {
        renderTable(data.orders);
        renderPagination(data.currentPage, data.totalPages);
    } else {
        Swal.fire("Error!", "Failed to load orders", "error");
    }
}


// Render table rows
function renderTable(orders) {
    const tbody = document.getElementById("orderBody");
    tbody.innerHTML = "";

    orders.forEach(order => {
        tbody.innerHTML += `
            <tr class="bg-white shadow-sm">
                <td class="p-2 font-medium">${order.items[0].productId?.productName || "-"}</td>
                <td class="p-2">${order.address.firstName} ${order.address.lastName}</td>
                <td class="p-2">${order.address.addressLine}</td>
                <td class="p-2">${order.totalAmount}</td>
                <td class="p-2">${new Date(order.createdAt).toDateString()}</td>
                <td class="p-2">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold text-green-600 bg-green-100">
                        ${order.status}
                    </span>
                </td>
                <td class="p-2">
                    <a href="/admin/orderdetails/${order._id}">
                        <button class="p-2 border rounded-md hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M15.232 5.232l3.536 3.536M9 11l6-6m-6 6v3h3l6-6m-3 13H6a2 2 0 01-2-2V6a2 2 0 012-2h7" />
                            </svg>
                        </button>
                    </a>
                </td>
            </tr>
        `;
    });
}

// Render Pagination Buttons
function renderPagination(current, total) {
    const wrapper = document.getElementById("paginationWrapper");
    wrapper.innerHTML = "";

    if (current > 1) {
        wrapper.innerHTML += `<button class="px-4 py-2 bg-gray-200 rounded" onclick="loadOrders(${current - 1},searchInput.value, statusFilter.value)">Prev</button>`;
    }

    for (let i = 1; i <= total; i++) {
        wrapper.innerHTML += `
            <button class="px-4 py-2 rounded ${current === i ? 'bg-black text-white' : 'bg-gray-200'}"
                onclick="loadOrders(${i},searchInput.value,statusFilter.value)">${i}</button>
        `;
    }

    if (current < total) {
        wrapper.innerHTML += `<button class="px-4 py-2 bg-gray-200 rounded" onclick="loadOrders(${current + 1},searchInput.value,statusFilter.value)">Next</button>`;
    }
}

let searchTimer;
searchInput.addEventListener('input',()=>{
    clearTimeout(searchTimer)
    searchTimer=setTimeout(()=>{
        let searchTerm= searchInput.value.trim()
        loadOrders(1,searchTerm,statusFilter.value)
    },400)
})
loadOrders(1,searchInput.value);
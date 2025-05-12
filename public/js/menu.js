// public/js/menu.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('🍔 menu.js loaded');
    const ham  = document.querySelector('.hamburger');
    const menu = document.querySelector('#nav-menu');
  
    if (!ham || !menu) {
      console.error('🍔 .hamburger or #nav-menu not found');
      return;
    }
  
    ham.addEventListener('click', e => {
      e.stopPropagation();
      console.log('🍔 hamburger clicked');
      menu.classList.toggle('show');
    });
  
    document.addEventListener('click', () => {
      menu.classList.remove('show');
    });
  });
  
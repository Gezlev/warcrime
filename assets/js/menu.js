const menu = document.querySelector('.menu');
const menuOpen = document.querySelector('.header__menu');
const menuClose = document.querySelector('.menu__close');

menuOpen &&  menuOpen.addEventListener('click', () => menu && menu.classList.add('visible'), {passive: true});
menuClose &&  menuClose.addEventListener('click', () => menu && menu.classList.remove('visible'), {passive: true});

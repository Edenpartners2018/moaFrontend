const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/home/HomeView.vue') },
      { path: 'signin', component: () => import('pages/user/SignView.vue') },
      
      // cms related
      { name: 'blog', path: 'blog', component: () => import('pages/blog/BlogView.vue') },

      // market related
      { name: 'trend', path: 'trend', component: () => import('pages/trend/TrendView.vue') },
      { name: 'cwatch', path: 'cwatch', component: () => import('pages/cwatch/CWatchView.vue') },
      { path: 'world', component: () => import('pages/world/WorldView.vue') },
      { name: 'sector', path: 'sector', component: () => import('pages/sector/SectorView.vue') },
      { name: 'asset', path: '/asset', component: () => import('pages/asset/AssetView.vue') },
      { path: 'risk', component: () => import('pages/risk/RiskView.vue') },
      
      //research menus
      { name:'cryptovc', path: 'cryptovc', component: () => import('pages/cryptovc/CryptovcView.vue') },
      { name: 'vcportfolio', path: 'vcportfolio', component: () => import('pages/vcportfolio/VCPortfolioView.vue') },
    ],    
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;

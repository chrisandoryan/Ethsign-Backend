function web3_check_metamask() {
    if (!window.ethereum) {
        console.error('It seems that the MetaMask extension is not detected. Please install MetaMask first.');
        alert('It seems that the MetaMask extension is not detected. Please install MetaMask first.');
        return false;
    } else {
        console.log('MetaMask extension has been detected!!');
        return true;
    }
}
async function web3_metamask_login() {
    // Check first if the user has the MetaMask installed
    if (web3_check_metamask()) {
        console.log('Initate Login Process');

        // Get the Ethereum provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // Get Ethereum accounts
        await provider.send("eth_requestAccounts", []);
        console.log("Connected!!");
        // Get the User Ethereum address
        const address = await provider.getSigner().getAddress();
        console.log(address);

        // Check if user (the address) has been registered
        
    }
}   